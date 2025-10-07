const express = require('express')
const { getStorage, postStorage, postStorage2, getStorageByDate, getStorageByDate2, transferLifeSmoothi, transferLifeSmoothi2, getLifeSmoothie, postSmoothie, getSmoothies, getIngredientsByNames, saveSmoothieProduction, getLifeSmoothieByDate, getSmoothieProductionByDate, getDrivers, addDriver, updateDriver, deleteDriver, preDispatch, getPreDispatches, completeDispatch, getCompletedDispatches } = require('./controller')
const router = express.Router();
const userController = require('./user');

router.post('/postStorage', postStorage);
router.post('/postStorage2', postStorage2);
// router.get('/getStorage', getStorage);
// router.post('/transferStorage', transferStorage);
router.post('/transferLifeSmoothi', transferLifeSmoothi);
router.post('/transferLifeSmoothi2', transferLifeSmoothi2);
router.get('/getLifeSmoothie', getLifeSmoothie);
router.post('/postSmoothie', postSmoothie);
router.get('/getSmoothies', getSmoothies);
router.post('/getIngredientsByNames', getIngredientsByNames);
router.post('/saveSmoothieProduction', saveSmoothieProduction);
router.get('/getLifeSmoothieByDate', getLifeSmoothieByDate);
router.get('/getStorageByDate', getStorageByDate);
router.get('/getStorageByDate2', getStorageByDate2);
router.get('/getSmoothieProductionByDate', getSmoothieProductionByDate);
router.get('/getDrivers', getDrivers);
router.post('/addDriver', addDriver);
router.put('/updateDriver/:id', updateDriver);
router.delete('/deleteDriver/:id', deleteDriver);
router.post('/preDispatch', preDispatch);
router.get('/getPreDispatches', getPreDispatches);
router.post('/completeDispatch', completeDispatch);
router.get('/getCompletedDispatches', getCompletedDispatches);


// Role routes
router.post("/addRole", userController.addRole);
router.get("/fetchRole", userController.fetchRole);
router.put("/updateRole/:id", userController.updateRole);
router.delete("/deleteRole/:id", userController.deleteRole);

// User Routes
router.post("/users", userController.addUser);
router.get("/users", userController.fetchUsers);

// router.get("/users/:id", userController.fetchUserById);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.get("/users/all", userController.getAllusers);
router.get("/users/:id/details", userController.getUserDetails);
router.put("/users/:id/status", userController.updateUserStatus);
router.get("/getroles", userController.getroles);
router.post("/check", userController.checkusername);
router.get("/counts", userController.getCounts);
router.get("/users/:id", userController.getUserById);
router.get("/currect_login", userController.getActiveUsers);

//Login, Logout Routes
router.post("/logout", userController.logoutUser);
router.post("/login", userController.loginUser);
router.post("/verifyUser", userController.forget_password);
router.post("/resetPassword", userController.change_password);
router.post("/forgotrequest", userController.forget_password_request);

module.exports = router;