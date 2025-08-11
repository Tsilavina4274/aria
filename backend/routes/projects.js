import express from 'express';
import Joi from 'joi';
import { authenticateToken } from './admin.js';
import { prisma } from '../lib/prisma.js';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // stockage en mémoire, buffer accessible via req.file.buffer

// Validation schema pour les projets
const projectSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  technologies: Joi.array().items(Joi.string()).min(1).required(),
  client: Joi.string().min(2).max(100).required(),
  duration: Joi.string().min(2).max(50).required(),
  status: Joi.string().valid('EN_COURS', 'TERMINE', 'EN_ATTENTE').required(),
  url: Joi.string().uri().allow('').optional(),
  imageUrl: Joi.string().allow('').optional(),
  date: Joi.string().optional()
});

// Default projects fallback data
const getDefaultProjects = () => [
  {
    id: "1",
    title: "CGEPRO",
    description: "Votre spécialiste du bois exotique et des aménagements extérieurs sur La Réunion",
    technologies: ["WordPress", "PHP", "MySQL", "SEO"],
    client: "CGEPRO",
    duration: "2 mois",
    status: "TERMINE",
    imageUrl: "/src/assets/go.jpg",
    date: "15/03/2024",
    url: "https://cgepro.com",
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15')
  },
  {
    id: "2",
    title: "ERIC RABY",
    description: "Coaching en compétences sociales et émotionnelles",
    technologies: ["React", "Node.js", "Stripe", "Calendar API"],
    client: "Eric Raby Coaching",
    duration: "3 mois",
    status: "TERMINE",
    imageUrl: "/src/assets/eric.jpg",
    date: "22/04/2024",
    url: "https://eric-raby.com",
    createdAt: new Date('2024-04-22'),
    updatedAt: new Date('2024-04-22')
  },
  {
    id: "3",
    title: "CONNECT TALENT",
    description: "Plateforme de mise en relation entre entreprises et talents africains",
    technologies: ["Vue.js", "Laravel", "PostgreSQL", "Socket.io"],
    client: "Connect Talent Inc",
    duration: "5 mois",
    status: "TERMINE",
    imageUrl: "/src/assets/connect.png",
    date: "10/05/2024",
    url: "https://connecttalent.cc",
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-10')
  },
  {
    id: "4",
    title: "SOA DIA TRAVEL",
    description: "Transport & Logistique à Madagascar",
    technologies: ["Angular", "Express.js", "MongoDB", "Maps API"],
    client: "SOA DIA TRAVEL",
    duration: "4 mois",
    status: "TERMINE",
    imageUrl: "/src/assets/soa.jpg",
    date: "28/06/2024",
    url: "https://soatransplus.mg",
    createdAt: new Date('2024-06-28'),
    updatedAt: new Date('2024-06-28')
  }
];

// Helper function to convert database project to API format
const formatProjectForAPI = (project) => {
  return {
    ...project,
    technologies: typeof project.technologies === 'string'
      ? JSON.parse(project.technologies)
      : project.technologies
  };
};

// GET /api/projects - Récupérer tous les projets (publics)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: 'TERMINE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedProjects = projects.map(formatProjectForAPI);

    res.json({
      success: true,
      data: { projects: formattedProjects }
    });
  } catch (error) {
    console.error('Database not available, using fallback data:', error.message);

    // Return default projects as fallback
    const defaultProjects = getDefaultProjects().filter(p => p.status === 'TERMINE');
    res.json({
      success: true,
      data: { projects: defaultProjects }
    });
  }
});

// GET /api/projects/admin - Récupérer tous les projets (admin seulement)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedProjects = projects.map(formatProjectForAPI);

    res.json({
      success: true,
      data: { projects: formattedProjects }
    });
  } catch (error) {
    console.error('Database not available for admin, using fallback data:', error.message);

    // Return all default projects as fallback for admin
    const defaultProjects = getDefaultProjects();
    res.json({
      success: true,
      data: { projects: defaultProjects }
    });
  }
});

// GET /api/projects/:id - Récupérer un projet spécifique
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
});

// POST /api/projects - Créer un nouveau projet (admin seulement)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Joi ne gère pas multipart/form-data, on valide ici les champs texte
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.details[0].message
      });
    }

    // Conversion des technologies si c'est une string JSON
    let technologies = value.technologies;
    if (typeof technologies === 'string') {
      try {
        technologies = JSON.parse(technologies);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Format technologies invalide',
          details: 'Les technologies doivent être un tableau JSON valide'
        });
      }
    }

    // Générer un slug depuis le titre
    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
        .trim()
        .replace(/\s+/g, '-') // Remplacer espaces par tirets
        .replace(/-+/g, '-'); // Éviter les tirets multiples
    };

    // Préparer données pour Prisma
    const projectData = {
      ...value,
      technologies,
      date: value.date ? new Date(value.date) : new Date(),
      image: req.file?.buffer || null,  // Buffer binaire ou null
      slug: generateSlug(value.title), // Générer le slug
    };

    const newProject = await prisma.project.create({
      data: projectData,
    });

    console.log(`📝 Nouveau projet créé : ${newProject.title} par ${req.user.email || 'Inconnu'}`);

    // Formatter le projet avant renvoi (ex: convertir technologies JSON vers array)
    const formattedProject = formatProjectForAPI(newProject);

    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: { project: formattedProject }
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet :', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création du projet',
      details: error.message
    });
  }
});

// PUT /api/projects/:id - Mettre à jour un projet (admin seulement)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    // Validation des données
    const { error, value } = projectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.details[0].message
      });
    }

    // Conversion des technologies si c'est une string JSON
    let technologies = value.technologies;
    if (typeof technologies === 'string') {
      try {
        technologies = JSON.parse(technologies);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Format technologies invalide',
          details: 'Les technologies doivent être un tableau JSON valide'
        });
      }
    }

    // Préparer données pour Prisma
    const projectData = {
      ...value,
      technologies,
      date: value.date ? new Date(value.date) : new Date(),
    };

    // Ajouter l'image si elle est fournie
    if (req.file?.buffer) {
      projectData.image = req.file.buffer;
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: req.params.id
      },
      data: projectData,
    });

    console.log(`✏️ Project updated: ${updatedProject.title} by ${req.user.email || 'Unknown'}`);

    // Formatter le projet avant renvoi
    const formattedProject = formatProjectForAPI(updatedProject);

    res.json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: { project: formattedProject }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Projet non trouvé'
      });
    }
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du projet',
      details: error.message
    });
  }
});

// DELETE /api/projects/:id - Supprimer un projet (admin seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedProject = await prisma.project.delete({
      where: {
        id: req.params.id
      }
    });

    console.log(`🗑️ Project deleted: ${deletedProject.title} by ${req.user.email || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Projet non trouvé'
      });
    }
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du projet',
      details: error.message
    });
  }
});

// POST /api/projects/:id/status - Changer le statut d'un projet (admin seulement)
router.post('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['EN_COURS', 'TERMINE', 'EN_ATTENTE'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide'
      });
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: req.params.id
      },
      data: {
        status: status
      }
    });

    console.log(`📊 Project status updated: ${updatedProject.title} -> ${status} by ${req.user.email || 'Unknown'}`);

    // Return formatted project (convert technologies back to array)
    const formattedProject = formatProjectForAPI(updatedProject);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: { project: formattedProject }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Projet non trouvé'
      });
    }
    console.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
      details: error.message
    });
  }
});

export default router;
