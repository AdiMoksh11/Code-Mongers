const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { uploadProjectImage } = require("../middlewares/uploadMiddleware");
const { validateProjectData, validateProjectId, errorHandler } = require("../middlewares/validationMiddleware");
const projectController = require("../controllers/projectController");

const router = express.Router();

// Routes for /api/users/me/projects
router.route("/")
  .get(protect, projectController.getAllProjects)
  .post(protect, uploadProjectImage, validateProjectData, projectController.createProject);

router.route("/:projectId")
  .get(protect, validateProjectId, projectController.getProject)
  .put(protect, validateProjectId, uploadProjectImage, validateProjectData, projectController.updateProject)
  .delete(protect, validateProjectId, projectController.deleteProject);

// Error handling middleware (should be last)
router.use(errorHandler);

module.exports = router;