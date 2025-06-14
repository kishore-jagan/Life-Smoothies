const express = require('express')
const { getStorage, postStorage, postStorage2, transferLifeSmoothi, transferLifeSmoothi2, getLifeSmoothie, postSmoothie, getSmoothies, getIngredientsByNames, saveSmoothieProduction, getLifeSmoothieByDate, getStorageByDate, getStorageByDate2, getSmoothieProductionByDate, getDrivers, preDispatch, getPreDispatches, completeDispatch } = require('./controller')

const router = express.Router();

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
router.post('/preDispatch', preDispatch);
router.get('/getPreDispatches', getPreDispatches);
router.post('/completeDispatch', completeDispatch);

module.exports = router;