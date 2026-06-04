const express = require('express');
const {
  obtenerCuenta,
  obtenerMovimientos,
  obtenerPerfil,
  actualizarPerfil,
  validarNumeroCuenta,          
} = require('../controllers/cuentaController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/saldo', obtenerCuenta);
router.get('/movimientos', obtenerMovimientos);
router.get('/perfil', obtenerPerfil);
router.put('/perfil', actualizarPerfil);
router.get('/validar/:numeroCuenta', validarNumeroCuenta); 

module.exports = router;