const express = require("express");
const router = express.Router();
const listingController = require("../../controllers/listingController");
const verifyJWT = require("../../middleware/verifyJWT");

router.route("/").get(listingController.getAllApprovedBusinesses);

// Add route to get all businesses
router.route("/all").get(listingController.getAllBusinesses);

// Add route to update isApproved value of a business
router.route("/all/:businessId/approve").put(listingController.approveBusiness);

router.route("/:id").get(listingController.getBusiness);
router
  .route("/dashboard/:id")
  .get(verifyJWT, listingController.getBusiness)
  .put(verifyJWT, listingController.updateBusinessDetails)
  .post(verifyJWT, listingController.addProductToInventory)
  .delete(verifyJWT, listingController.deleteAccount);
router
  .route("/dashboard/:businessId/inventory/:productId")
  .put(verifyJWT, listingController.updateProductInInventory)
  .delete(verifyJWT, listingController.deleteProductFromInventory);
router
  .route("/dashboard/change-password/:id")
  .put(verifyJWT, listingController.changePassword);

module.exports = router;
