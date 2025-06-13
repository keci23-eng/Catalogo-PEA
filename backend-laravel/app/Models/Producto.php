<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
     protected $fillable = [
        'titulo',
        'slug',
        'descripcion',
        'precio',
        'stock',
        'imagen',
    ];   

    public function categorias()
    {
        return $this->belongsToMany(Categoria::class, 'categoria_producto');
    }

    public function carrito()
    {
        return $this->belongsToMany(Carrito::class, 'carrito_producto');
    }

    public function pedidos()
    {
        return $this->belongsToMany(Pedido::class, 'pedidos_productos');
    }
}
