import { Router } from "express";
import { protectParent } from "../middlewares/parentAuth.middleware";
import { validate } from "../utils/validation.util";
import {
  assignDeviceChildSchema,
  childProfileCreateSchema,
  childProfileUpdateSchema,
  createPairingCodeSchema,
} from "../utils/parentValidation.util";
import {
  createChildProfileController,
  deleteChildProfileController,
  listChildProfilesController,
  updateChildProfileController,
} from "../controllers/parentChild.controller";
import {
  assignDeviceChildController,
  createPairingCodeController,
  listParentDevicesController,
} from "../controllers/parentDevice.controller";

const router = Router();

router.use(protectParent);

router.get("/children", listChildProfilesController);
router.post("/children", validate(childProfileCreateSchema), createChildProfileController);
router.patch("/children/:id", validate(childProfileUpdateSchema), updateChildProfileController);
router.delete("/children/:id", deleteChildProfileController);

router.post("/devices/pairing-codes", validate(createPairingCodeSchema), createPairingCodeController);
router.get("/devices", listParentDevicesController);
router.patch("/devices/:deviceId/child", validate(assignDeviceChildSchema), assignDeviceChildController);

export default router;

