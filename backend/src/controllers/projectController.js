const ProjectService = require("../services/projectService");

const projectController = {
  // Get all projects for the authenticated user
  getAllProjects: async (req, res) => {
    try {
      const projects = await ProjectService.getUserProjects(req.user.id);
      res.json({ 
        success: true, 
        projects 
      });
    } catch (error) {
      console.error("Get projects error:", error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || "Failed to fetch projects." 
      });
    }
  },

  // Get a single project
  getProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectById(req.user.id, projectId);
      
      res.json({ 
        success: true, 
        project 
      });
    } catch (error) {
      console.error("Get project error:", error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || "Failed to fetch project." 
      });
    }
  },

  // Add a new project
  createProject: async (req, res) => {
    try {
      const { title, description, projectUrl, githubUrl, technologies } = req.body;
      
      // Parse technologies if it's a JSON string (from FormData)
      const parsedTechnologies = technologies ? 
        (typeof technologies === 'string' ? JSON.parse(technologies) : technologies) 
        : [];

      const projectData = {
        title,
        description,
        projectUrl,
        githubUrl,
        technologies: parsedTechnologies
      };

      // Validate project data
      const validation = ProjectService.validateProjectData(projectData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: validation.errors.join(', ') 
        });
      }

      const projects = await ProjectService.createProject(
        req.user.id, 
        projectData, 
        req.file
      );

      res.status(201).json({ 
        success: true, 
        message: "Project added successfully!", 
        projects 
      });

    } catch (error) {
      console.error("Add project error:", error);
      const statusCode = error.message === 'User not found' ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || "Failed to add project." 
      });
    }
  },

  // Update a project
  updateProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { title, description, projectUrl, githubUrl, technologies } = req.body;
      
      // Parse technologies if it's a JSON string (from FormData)
      const parsedTechnologies = technologies ? 
        (typeof technologies === 'string' ? JSON.parse(technologies) : technologies) 
        : [];

      const projectData = {
        title,
        description,
        projectUrl,
        githubUrl,
        technologies: parsedTechnologies
      };

      // Validate project data
      const validation = ProjectService.validateProjectData(projectData);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: validation.errors.join(', ') 
        });
      }

      const projects = await ProjectService.updateProject(
        req.user.id, 
        projectId, 
        projectData, 
        req.file
      );

      res.json({ 
        success: true, 
        message: "Project updated successfully!", 
        projects 
      });

    } catch (error) {
      console.error("Update project error:", error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || "Failed to update project." 
      });
    }
  },

  // Delete a project
  deleteProject: async (req, res) => {
    try {
      const { projectId } = req.params;
      
      const projects = await ProjectService.deleteProject(req.user.id, projectId);

      res.json({ 
        success: true, 
        message: "Project deleted successfully!", 
        projects 
      });

    } catch (error) {
      console.error("Delete project error:", error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ 
        message: error.message || "Failed to delete project." 
      });
    }
  }
};

module.exports = projectController;