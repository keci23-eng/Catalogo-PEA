<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Producto as Productos;

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
}