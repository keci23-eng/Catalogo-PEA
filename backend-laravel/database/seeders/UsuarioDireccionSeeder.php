<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Direccion;
use Illuminate\Support\Facades\Hash;

class UsuarioDireccionSeeder extends Seeder
{
    public function run(): void
    {
        // Crear usuario admin
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@tienda.com',
            'password' => Hash::make('admin123'),
            'rol' => 'admin',
        ]);
 
        // Crear usuario cliente
        $cliente = User::create([
            'name' => 'Cliente User',
            'email' => 'cliente@tienda.com',
            'password' => Hash::make('cliente123'),
            'rol' => 'cliente',
        ]);
 
        // Agregar direcciones
        Direccion::create([
            'user_id' => $admin->id,
            'direccion' => 'Av. Central 123',
            'ciudad' => 'Quito',
            'provincia' => 'Pichincha',
            'telefono' => '0987654321',
        ]);
 
        Direccion::create([
            'user_id' => $cliente->id,
            'direccion' => 'Calle Falsa 456',
            'ciudad' => 'Guayaquil',
            'provincia' => 'Guayas',
            'telefono' => '0976543210',
        ]);
    }
}
