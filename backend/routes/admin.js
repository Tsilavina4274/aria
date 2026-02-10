import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Configuration du rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Trop de tentatives',
      message: 'Veuillez réessayer dans 15 minutes',
      retryAfter: req.rateLimit.resetTime
    });
  },
  keyGenerator: (req) => {
    return req.ip + req.body.email; // Limite par IP + email
  }
});

// Schémas de validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'any.required': 'Mot de passe requis'
  })
});

// Middleware d'authentification amélioré
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      error: 'Non autorisé',
      message: 'Token d\'accès manquant'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' 
        ? 'Token expiré' 
        : 'Token invalide';
      
      return res.status(403).json({ 
        error: 'Accès refusé',
        message,
        expiredAt: err.expiredAt
      });
    }

    try {
      // Vérification supplémentaire en base de données
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: { id: true, role: true }
      });

      if (!user) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Compte non valide'
        });
      }

      req.user = { ...decoded, id: user.id };
      next();
    } catch (dbError) {
      console.error('Database verification error:', dbError);
      res.status(500).json({ 
        error: 'Erreur serveur',
        message: 'Impossible de vérifier le token'
      });
    }
  });
};

// POST /api/admin/login - Connexion sécurisée
router.post('/login', loginLimiter, async (req, res) => {
  try {
    // Validation avancée
    const { error, value } = loginSchema.validate(req.body, { 
      abortEarly: false 
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path[0],
          message: d.message
        }))
      });
    }

    const { email, password } = value;

    // Recherche de l'utilisateur en base de données
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,// Assurez-vous que ce champ existe dans votre modèle Prisma
      }
    });

    // Vérification du compte
    if (!user) {
      return res.status(401).json({ 
        error: 'Non autorisé',
        message: 'Aucun compte trouvé avec cet email'
      });
    }

    // Vérification du rôle admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Cette fonctionnalité est réservée aux administrateurs'
      });
    }

    // Comparaison sécurisée du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Non autorisé',
        message: 'Mot de passe incorrect'
      });
    }

    // Génération du token avec des claims personnalisés
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iss: 'aria-creative-api',
        aud: 'aria-creative-client'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '4h',
        algorithm: 'HS256'
      }
    );

    // Cookie sécurisé en plus du token dans la réponse
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Plus flexible que 'strict' pour le développement
      maxAge: 4 * 60 * 60 * 1000 // 4 heures
    });

    // Log de sécurité
    console.log(`🔐 Connexion admin réussie: ${user.email} (ID: ${user.id})`);

    // Réponse sans le mot de passe
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Authentification réussie',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    
    // Meilleure gestion des erreurs Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({
        error: 'Erreur base de données',
        message: 'Impossible de vérifier les informations de connexion'
      });
    }

    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Échec de l\'authentification'
    });
  }
});

// POST /api/admin/verify - Vérification améliorée
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Non trouvé',
        message: 'Utilisateur introuvable' 
      });
    }

    res.json({
      success: true,
      user,
      message: 'Session valide',
      expiresIn: req.user.exp
    });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Impossible de vérifier la session'
    });
  }
});

// POST /api/admin/refresh - Renouvellement sécurisé
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Non trouvé',
        message: 'Utilisateur introuvable' 
      });
    }

    const newToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
    );

    // Mise à jour du cookie
    res.cookie('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token: newToken,
      message: 'Token rafraîchi'
    });
  } catch (error) {
    console.error('Erreur rafraîchissement token:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Échec du rafraîchissement'
    });
  }
});

// POST /api/admin/logout - Déconnexion complète
router.post('/logout', authenticateToken, (req, res) => {
  // Effacement du cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  console.log(`🔓 Déconnexion admin: ${req.user.email} (ID: ${req.user.sub})`);

  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// GET /api/admin/profile - Profil complet
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { 
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'Non trouvé',
        message: 'Profil introuvable' 
      });
    }

    res.json({
      success: true,
      user,
      message: 'Profil récupéré avec succès'
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le profil'
    });
  }
});

export default router;
