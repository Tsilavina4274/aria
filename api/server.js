import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Base de données en mémoire pour le développement
let projects = [
  {
    id: uuidv4(),
    title: "CGEPRO",
    description: "Votre spécialiste du bois exotique et des aménagements extérieurs sur La Réunion",
    technologies: ["WordPress", "PHP", "MySQL", "SEO"],
    client: "CGEPRO",
    duration: "2 mois",
    status: "TERMINE",
    url: "https://cgepro.com",
    date: "2024-03-15",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: "ERIC RABY",
    description: "Coaching en compétences sociales et émotionnelles",
    technologies: ["React", "Node.js", "Stripe", "Calendar API"],
    client: "Eric Raby Coaching",
    duration: "3 mois",
    status: "TERMINE",
    url: "https://eric-raby.com",
    date: "2024-04-22",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    title: "CONNECT TALENT",
    description: "Plateforme de mise en relation entre entreprises et talents africains",
    technologies: ["Vue.js", "Laravel", "PostgreSQL", "Socket.io"],
    client: "Connect Talent Inc",
    duration: "5 mois",
    status: "TERMINE",
    url: "https://connecttalent.cc",
    date: "2024-05-10",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let users = [
  {
    id: uuidv4(),
    email: "admin@aria-creative.com",
    password: "admin@aria25!!",
    name: "Administrateur",
    role: "ADMIN"
  }
];

let contactMessages = [];

// Helper functions
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Admin routes
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user && user.role === 'ADMIN') {
    res.json({
      success: true,
      message: 'Authentification réussie',
      token: 'fake-jwt-token-' + Date.now(),
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Non autorisé',
      message: 'Email ou mot de passe incorrect'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Projects routes
app.get('/api/projects', (req, res) => {
  const publicProjects = projects.filter(p => p.status === 'TERMINE');
  res.json({
    success: true,
    data: { projects: publicProjects }
  });
});

app.get('/api/projects/admin', (req, res) => {
  res.json({
    success: true,
    data: { projects: projects }
  });
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (project) {
    res.json({
      success: true,
      project: project
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Projet non trouvé'
    });
  }
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: uuidv4(),
    ...req.body,
    slug: generateSlug(req.body.title),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  
  res.status(201).json({
    success: true,
    message: 'Projet créé avec succès',
    data: { project: newProject }
  });
});

app.put('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Projet non trouvé'
    });
  }
  
  projects[projectIndex] = {
    ...projects[projectIndex],
    ...req.body,
    slug: generateSlug(req.body.title),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Projet mis à jour avec succès',
    data: { project: projects[projectIndex] }
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Projet non trouvé'
    });
  }
  
  projects.splice(projectIndex, 1);
  
  res.json({
    success: true,
    message: 'Projet supprimé avec succès'
  });
});

app.post('/api/projects/:id/status', (req, res) => {
  const { status } = req.body;
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Projet non trouvé'
    });
  }
  
  if (!['EN_COURS', 'TERMINE', 'EN_ATTENTE'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Statut invalide'
    });
  }
  
  projects[projectIndex].status = status;
  projects[projectIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Statut mis à jour avec succès',
    data: { project: projects[projectIndex] }
  });
});

// Contact routes
app.post('/api/contact', (req, res) => {
  const newMessage = {
    id: uuidv4(),
    ...req.body,
    status: 'NOUVEAU',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  contactMessages.push(newMessage);
  
  res.json({
    success: true,
    message: 'Message envoyé avec succès'
  });
});

app.get('/api/contact/admin', (req, res) => {
  res.json({
    success: true,
    data: { messages: contactMessages }
  });
});

app.delete('/api/contact/admin/:id', (req, res) => {
  const messageIndex = contactMessages.findIndex(m => m.id === req.params.id);
  
  if (messageIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }
  
  contactMessages.splice(messageIndex, 1);
  
  res.json({
    success: true,
    message: 'Message supprimé avec succès'
  });
});

app.put('/api/contact/admin/:id/status', (req, res) => {
  const { status } = req.body;
  const messageIndex = contactMessages.findIndex(m => m.id === req.params.id);
  
  if (messageIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Message non trouvé'
    });
  }
  
  contactMessages[messageIndex].status = status;
  contactMessages[messageIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: { message: contactMessages[messageIndex] }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API démarré sur le port ${PORT}`);
  console.log(`📊 ${projects.length} projets initialisés`);
  console.log(`👤 Admin: admin@aria-creative.com / admin@aria25!!`);
});
