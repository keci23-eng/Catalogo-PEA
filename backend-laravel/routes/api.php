<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AuthController;

//rutas publicas
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

//productos
Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/{id}', [ProductoController::class, 'show']);
Route::get('/categoria', [ProductoController::class, 'categoria']);

//rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/categorias', [ProductoController::class, 'storeCategoria'])->middleware('IsAdmin:admin');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/productos', [ProductoController::class, 'store'])->middleware('IsAdmin:admin');
    Route::put('/productos/{id}', [ProductoController::class, 'update'])->middleware('IsAdmin:admin');
    Route::delete('/productos/{id}', [ProductoController::class, 'destroy'])->middleware('IsAdmin:admin');

    // Carrito
    Route::post('/carrito/agregar', [ProductoController::class, 'agregarAlCarrito']);
    Route::get('/carrito', [ProductoController::class, 'verCarrito']);
    Route::post('/carrito/actualizar', [ProductoController::class, 'actualizarCarrito']);
    Route::post('/carrito/eliminar', [ProductoController::class, 'eliminarDelCarrito']);

    // Pedidos
    Route::post('/pedidos', [ProductoController::class, 'crearPedido']);
    Route::get('/pedidos', [ProductoController::class, 'listarPedidos'])->middleware('IsAdmin:admin');
    Route::post('/pedidos/{id}/aceptar', [ProductoController::class, 'aceptarPedido'])->middleware('IsAdmin:admin');
    Route::get('/pedidos/mis', [ProductoController::class, 'misPedidos']);
    Route::delete('/pedidos/{id}', [ProductoController::class, 'eliminarPedido']);

    // Dirección del usuario autenticado
    Route::get('/usuario/direccion', [ProductoController::class, 'direccionUsuario']);
});

