<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Producto as Productos;
use App\Models\Carrito;
use App\Models\CarritoProducto;
use App\Models\Pedido;
use App\Models\PedidoProducto;
use App\Models\Producto;
use Illuminate\Support\Facades\Auth;

class ProductoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Productos::with('categorias')->get();
    }

    /**
     * Store a newly created resource in storage.
     */

    public function categoria()
    {
        $categorias = \App\Models\Categoria::all();
        return response()->json($categorias, 200);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'imagen' => 'nullable|string',
            'stock' => 'required|integer|min:0',
            'categorias' => 'nullable|array',
            'categorias.*' => 'exists:categorias,id',
        ]);

        $producto = DB::transaction(function () use ($validated, $request) {
            $producto = Productos::create($validated);

            if ($request->has('categorias')) {
                $producto->categorias()->sync($validated['categorias']);
            }

            //retornamos el producto con las categorias
            return response()-> json($producto->load('categorias'), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $producto = Productos::with('categorias')->findOrFail($id);
        return response()->json($producto, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $producto = Productos::findOrFail($id);

        $validated = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string',
            'precio' => 'sometimes|required|numeric|min:0',
            'imagen' => 'nullable|string',
            'stock' => 'sometimes|required|integer|min:0',
            'categorias' => 'nullable|array',
            'categorias.*' => 'exists:categorias,id',
        ]);
        
        $producto = DB::transaction(function () use ($validated, $request, $producto) {
            $producto->update($validated);
            if ($request->has('categorias')) {
            $producto->categorias()->sync($validated['categorias']);
            }
        });
        //retornamos el producto con las categorias
        return response()->json($producto->load('categorias'), 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $producto = Productos::findOrFail($id);
        $producto->categorias()->detach(); // Desvincular las categorías
        $producto->delete(); // Eliminar el producto

        return response()->json(['message' => 'Producto eliminado correctamente'], 200);
    }

    // --- CARRITO Y PEDIDOS ---
    // Agregar producto al carrito
    public function agregarAlCarrito(Request $request) {
        $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|integer|min:1',
        ]);
        $user = $request->user();
        $producto = Producto::findOrFail($request->producto_id);
        if ($request->cantidad > $producto->stock) {
            return response()->json(['message' => 'No hay suficiente stock para este producto.'], 400);
        }
        $carrito = Carrito::firstOrCreate(['user_id' => $user->id, 'estado' => 'activo']);
        $carritoProd = CarritoProducto::where('carrito_id', $carrito->id)
            ->where('producto_id', $request->producto_id)->first();
        if ($carritoProd) {
            $nuevaCantidad = $carritoProd->cantidad + $request->cantidad;
            if ($nuevaCantidad > $producto->stock) {
                return response()->json(['message' => 'No hay suficiente stock para este producto.'], 400);
            }
            $carritoProd->cantidad = $nuevaCantidad;
            $carritoProd->save();
        } else {
            CarritoProducto::create([
                'carrito_id' => $carrito->id,
                'producto_id' => $request->producto_id,
                'cantidad' => $request->cantidad,
            ]);
        }
        return response()->json(['message' => 'Producto agregado al carrito'], 200);
    }

    // Ver carrito del usuario
    public function verCarrito(Request $request) {
        $user = $request->user();
        $carrito = Carrito::where('user_id', $user->id)->where('estado', 'activo')->first();
        if (!$carrito) return response()->json(['productos' => []], 200);
        $productos = $carrito->carritoProductos()->with('producto')->get();
        return response()->json(['productos' => $productos], 200);
    }

    // Actualizar cantidad/eliminar producto del carrito
    public function actualizarCarrito(Request $request) {
        $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|integer|min:0',
        ]);
        $user = $request->user();
        $carrito = Carrito::where('user_id', $user->id)->where('estado', 'activo')->first();
        if (!$carrito) return response()->json(['message' => 'No hay carrito'], 404);
        $carritoProd = CarritoProducto::where('carrito_id', $carrito->id)
            ->where('producto_id', $request->producto_id)->first();
        if (!$carritoProd) return response()->json(['message' => 'No existe ese producto en el carrito'], 404);
        if ($request->cantidad == 0) {
            $carritoProd->delete();
        } else {
            $carritoProd->cantidad = $request->cantidad;
            $carritoProd->save();
        }
        return response()->json(['message' => 'Carrito actualizado'], 200);
    }

    // Eliminar producto del carrito (opcional, para eliminar directo)
    public function eliminarDelCarrito(Request $request) {
        $request->validate([
            'producto_id' => 'required|exists:productos,id',
        ]);
        $user = $request->user();
        $carrito = Carrito::where('user_id', $user->id)->where('estado', 'activo')->first();
        if (!$carrito) return response()->json(['message' => 'No hay carrito'], 404);
        $carritoProd = CarritoProducto::where('carrito_id', $carrito->id)
            ->where('producto_id', $request->producto_id)->first();
        if ($carritoProd) $carritoProd->delete();
        return response()->json(['message' => 'Producto eliminado del carrito'], 200);
    }

    // Crear pedido desde el carrito (ahora acepta datos de dirección)
    public function crearPedido(Request $request) {
        $user = $request->user();
        $carrito = Carrito::where('user_id', $user->id)->where('estado', 'activo')->first();
        if (!$carrito) return response()->json(['message' => 'No hay carrito'], 404);
        $productos = $carrito->carritoProductos()->with('producto')->get();
        if ($productos->isEmpty()) return response()->json(['message' => 'El carrito está vacío'], 400);
        // Buscar dirección existente
        $direccion = $user->direcciones()->first();
        // Si no hay dirección, intentar crearla con los datos recibidos
        if (!$direccion) {
            $data = $request->input('direccion');
            if (!$data || !isset($data['telefono'], $data['direccion'], $data['ciudad'], $data['provincia'])) {
                return response()->json(['message' => 'Faltan datos de dirección'], 400);
            }
            $direccion = $user->direcciones()->create([
                'telefono' => $data['telefono'],
                'direccion' => $data['direccion'],
                'ciudad' => $data['ciudad'],
                'provincia' => $data['provincia'],
            ]);
        }
        $total = 0;
        foreach ($productos as $item) {
            $total += $item->cantidad * $item->producto->precio;
        }
        $pedido = Pedido::create([
            'user_id' => $user->id,
            'direccion_id' => $direccion->id,
            'total' => $total,
            'estado' => 'pendiente',
            'fecha_pedido' => now(),
        ]);
        foreach ($productos as $item) {
            PedidoProducto::create([
                'pedido_id' => $pedido->id,
                'producto_id' => $item->producto_id,
                'cantidad' => $item->cantidad,
                'precio_unitario' => $item->producto->precio,
                'subtotal' => $item->cantidad * $item->producto->precio,
            ]);
        }
        $carrito->carritoProductos()->delete();
        $carrito->estado = 'comprado';
        $carrito->save();
        return response()->json(['message' => 'Pedido creado', 'pedido_id' => $pedido->id], 201);
    }

    // ADMIN: Listar pedidos
    public function listarPedidos() {
        $pedidos = Pedido::with(['user', 'pedidoProductos.producto', 'direccion'])->orderBy('created_at', 'desc')->get();
        return response()->json($pedidos->toArray(), 200);
    }

    // ADMIN: Aceptar pedido
    public function aceptarPedido($id) {
        $pedido = Pedido::findOrFail($id);
        $pedido->estado = 'aceptado';
        $pedido->save();
        return response()->json(['message' => 'Pedido aceptado'], 200);
    }

    // CLIENTE: Listar sus propios pedidos
    public function misPedidos(Request $request) {
        $user = $request->user();
        $pedidos = Pedido::with(['pedidoProductos.producto', 'direccion'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($pedidos, 200);
    }

    // CLIENTE: Eliminar su propio pedido
    public function eliminarPedido(Request $request, $id) {
        $user = $request->user();
        $pedido = Pedido::where('id', $id)->where('user_id', $user->id)->first();
        if (!$pedido) {
            return response()->json(['message' => 'Pedido no encontrado o no autorizado'], 404);
        }
        $pedido->delete();
        return response()->json(['message' => 'Pedido eliminado correctamente'], 200);
    }

    // Devuelve la primera dirección del usuario autenticado
    public function direccionUsuario(Request $request) {
        $user = $request->user();
        $direccion = $user->direcciones()->first();
        return response()->json(['direccion' => $direccion], 200);
    }
}