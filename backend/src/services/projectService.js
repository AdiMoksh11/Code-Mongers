const User = require("../models/userModel");
const { uploadFile, deleteFile } = require("./storageService");

class ProjectService {
  /**
   * Get all projects for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of projects
   */
  static async getUserProjects(userId) {
    const user = await User.findById(userId).select('projects');
    if (!user) {
      throw new Error('User not found');
    }
    return user.projects || [];
  }

  /**
   * Get a single project by ID
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project object
   */
  static async getProjectById(userId, projectId) {
    const user = await User.findById(userId).select('projects');
    if (!user) {
      throw new Error('User not found');
    }
    
    const project = user.projects.id(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    return project;
  }

  /**
   * Create a new project
   * @param {string} userId - User ID
   * @param {Object} projectData - Project data
   * @param {File} imageFile - Project image file (optional)
   * @returns {Promise<Array>} Updated projects array
   */
  static async createProject(userId, projectData, imageFile = null) {
    const { title, description, projectUrl, githubUrl, technologies } = projectData;
    
    if (!title || !title.trim()) {
      throw new Error('Project title is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newProject = {
      title: title.trim(),
      description: description?.trim() || "",
      projectUrl: projectUrl?.trim() || "",
      githubUrl: githubUrl?.trim() || "",
      technologies: technologies || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Handle project image upload
    if (imageFile) {
      const uploadResponse = await uploadFile(
        imageFile.buffer,
        `project_${Date.now()}_${imageFile.originalname}`,
        'image'
      );
      newProject.imageUrl = uploadResponse.url;
    }

    if (!user.projects) {
      user.projects = [];
    }
    
    user.projects.push(newProject);
    await user.save();

    return user.projects;
  }

  /**
   * Update an existing project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Updated project data
   * @param {File} imageFile - New project image file (optional)
   * @returns {Promise<Array>} Updated projects array
   */
  static async updateProject(userId, projectId, projectData, imageFile = null) {
    const { title, description, projectUrl, githubUrl, technologies } = projectData;
    
    if (!title || !title.trim()) {
      throw new Error('Project title is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const project = user.projects.id(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Update project fields
    project.title = title.trim();
    project.description = description?.trim() || "";
    project.projectUrl = projectUrl?.trim() || "";
    project.githubUrl = githubUrl?.trim() || "";
    project.technologies = technologies || [];
    project.updatedAt = new Date();

    // Handle project image upload
    if (imageFile) {
      // Delete old image if it exists
      if (project.imageUrl) {
        try {
          await deleteFile(project.imageUrl);
        } catch (error) {
          console.error('Failed to delete old project image:', error);
          // Continue with update even if old image deletion fails
        }
      }

      const uploadResponse = await uploadFile(
        imageFile.buffer,
        `project_${Date.now()}_${imageFile.originalname}`,
        'image'
      );
      project.imageUrl = uploadResponse.url;
    }

    await user.save();
    return user.projects;
  }

  /**
   * Delete a project
   * @param {string} userId - User ID
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Updated projects array
   */
  static async deleteProject(userId, projectId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const project = user.projects.id(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Delete project image if it exists
    if (project.imageUrl) {
      try {
        await deleteFile(project.imageUrl);
      } catch (error) {
        console.error('Failed to delete project image:', error);
        // Continue with project deletion even if image deletion fails
      }
    }

    // Remove project from array
    user.projects.pull(projectId);
    await user.save();

    return user.projects;
  }

  /**
   * Validate project data
   * @param {Object} projectData - Project data to validate
   * @returns {Object} Validation result
   */
  static validateProjectData(projectData) {
    const { title, projectUrl, githubUrl } = projectData;
    const errors = [];

    if (!title || !title.trim()) {
      errors.push('Project title is required');
    }

    if (projectUrl && !this.isValidUrl(projectUrl)) {
      errors.push('Project URL must be a valid URL');
    }

    if (githubUrl && !this.isValidUrl(githubUrl)) {
      errors.push('GitHub URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a string is a valid URL
   * @param {string} string - String to validate
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ProjectService;