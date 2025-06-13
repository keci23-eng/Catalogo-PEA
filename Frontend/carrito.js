// carrito.js
// Lógica para mostrar, actualizar y comprar el carrito

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('authToken') || localStorage.getItem('rol') !== 'cliente') {
        window.location.href = 'login.html';
        return;
    }
    cargarCarrito();
    cargarMisPedidos();
    document.getElementById('btn-comprar').addEventListener('click', comprarCarrito);
});

async function cargarCarrito() {
    const token = localStorage.getItem('authToken');
    const contenedor = document.getElementById('carrito-contenido');
    const totalDiv = document.getElementById('carrito-total');
    const mensajeDiv = document.getElementById('carrito-mensaje');
    contenedor.innerHTML = '<div class="text-blue-300">Cargando carrito...</div>';
    totalDiv.textContent = '';
    mensajeDiv.textContent = '';
    try {
        const res = await fetch('http://127.0.0.1:8000/api/carrito', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data.productos || data.productos.length === 0) {
            contenedor.innerHTML = '<div class="text-blue-400">Tu carrito está vacío.</div>';
            document.getElementById('btn-comprar').disabled = true;
            totalDiv.textContent = '';
            return;
        }
        let total = 0;
        let tabla = `<table class='min-w-full text-blue-100'><thead><tr>
            <th class='px-2 py-1'>Producto</th><th class='px-2 py-1'>Precio</th><th class='px-2 py-1'>Cantidad</th><th class='px-2 py-1'>Subtotal</th><th class='px-2 py-1'>Acciones</th></tr></thead><tbody>`;
        data.productos.forEach(item => {
            const prod = item.producto;
            const subtotal = prod.precio * item.cantidad;
            total += subtotal;
            tabla += `<tr>
                <td class='border px-2 py-1 flex items-center gap-2'><img src='${prod.imagen}' class='w-12 h-12 object-contain rounded'/>${prod.titulo}</td>
                <td class='border px-2 py-1'>$${prod.precio}</td>
                <td class='border px-2 py-1'><input type='number' min='1' value='${item.cantidad}' data-id='${prod.id}' class='cantidad-input w-16 text-black rounded px-2 py-1'/></td>
                <td class='border px-2 py-1'>$${subtotal}</td>
                <td class='border px-2 py-1'><button class='bg-red-600 text-white px-2 py-1 rounded eliminar-btn' data-id='${prod.id}'>Eliminar</button></td>
            </tr>`;
        });
        tabla += '</tbody></table>';
        contenedor.innerHTML = tabla;
        totalDiv.textContent = 'Total: $' + total;
        document.getElementById('btn-comprar').disabled = false;
        // Eventos para actualizar cantidad
        document.querySelectorAll('.cantidad-input').forEach(input => {
            input.addEventListener('change', async function() {
                const nuevaCantidad = parseInt(this.value);
                const prodId = this.getAttribute('data-id');
                // Busca el producto actual para validar stock
                const item = data.productos.find(p => p.producto.id == prodId);
                if (nuevaCantidad < 1) return;
                if (nuevaCantidad > item.producto.stock) {
                    alert('No puedes agregar más de ' + item.producto.stock + ' unidades. Stock insuficiente.');
                    this.value = item.producto.stock;
                    return;
                }
                await actualizarCantidad(prodId, nuevaCantidad);
            });
        });
        // Eventos para eliminar producto
        document.querySelectorAll('.eliminar-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const prodId = this.getAttribute('data-id');
                await eliminarDelCarrito(prodId);
            });
        });
    } catch (e) {
        contenedor.innerHTML = '<div class="text-red-400">Error al cargar el carrito.</div>';
    }
}

async function actualizarCantidad(productoId, cantidad) {
    const token = localStorage.getItem('authToken');
    try {
        await fetch('http://127.0.0.1:8000/api/carrito/actualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ producto_id: productoId, cantidad })
        });
        cargarCarrito();
    } catch (e) {
        alert('Error al actualizar cantidad.');
    }
}

async function eliminarDelCarrito(productoId) {
    const token = localStorage.getItem('authToken');
    try {
        await fetch('http://127.0.0.1:8000/api/carrito/eliminar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ producto_id: productoId })
        });
        cargarCarrito();
    } catch (e) {
        alert('Error al eliminar producto.');
    }
}

async function cargarMisPedidos() {
    const token = localStorage.getItem('authToken');
    const contenedor = document.getElementById('mis-pedidos');
    contenedor.innerHTML = '<div class="text-blue-300">Cargando pedidos...";</div>';
    try {
        const res = await fetch('http://127.0.0.1:8000/api/pedidos/mis', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const pedidos = await res.json();
        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            contenedor.innerHTML = '<div class="text-blue-400">No tienes pedidos recientes.</div>';
            return;
        }
        let tabla = `<table class='min-w-full text-blue-100'><thead><tr>
            <th class='px-2 py-1'>ID</th><th class='px-2 py-1'>Total</th><th class='px-2 py-1'>Estado</th><th class='px-2 py-1'>Fecha</th><th class='px-2 py-1'>Productos comprados</th><th class='px-2 py-1'>Acciones</th></tr></thead><tbody>`;
        pedidos.forEach(pedido => {
            let productosHtml = '<ul class="list-disc pl-4">';
            // Soporta ambos nombres de propiedad
            const productos = pedido.pedidoProductos || pedido.pedido_productos || [];
            productos.forEach(item => {
                const prod = item.producto;
                if (prod) {
                    productosHtml += `<li><strong>${prod.titulo}</strong> x${item.cantidad} <span class='text-green-400'>(Unitario: $${item.precio_unitario ?? prod.precio} , Subtotal: $${item.subtotal ?? (item.cantidad * (item.precio_unitario ?? prod.precio))})</span></li>`;
                } else {
                    productosHtml += `<li class='text-red-400'>Producto eliminado x${item.cantidad}</li>`;
                }
            });
            productosHtml += '</ul>';
            tabla += `<tr>
                <td class='border px-2 py-1'>${pedido.id}</td>
                <td class='border px-2 py-1'>$${pedido.total}</td>
                <td class='border px-2 py-1'>${pedido.estado === 'pendiente' ? "<span class='text-yellow-400 font-bold'>Pendiente</span>" : "<span class='text-green-400 font-bold'>Aceptado</span>"}</td>
                <td class='border px-2 py-1'>${pedido.fecha_pedido ? pedido.fecha_pedido.substring(0, 10) : ''}</td>
                <td class='border px-2 py-1'>${productosHtml}</td>
                <td class='border px-2 py-1'><button class='bg-red-600 text-white px-2 py-1 rounded eliminar-pedido-btn' data-id='${pedido.id}'>Eliminar</button></td>
            </tr>`;
        });
        tabla += '</tbody></table>';
        contenedor.innerHTML = tabla;
        // Evento para eliminar pedido
        document.querySelectorAll('.eliminar-pedido-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const pedidoId = this.getAttribute('data-id');
                if (confirm('¿Seguro que deseas eliminar este pedido?')) {
                    await eliminarPedido(pedidoId);
                }
            });
        });
    } catch (e) {
        contenedor.innerHTML = '<div class="text-red-400">Error al cargar tus pedidos.</div>';
    }
}

// Verifica si el usuario tiene dirección antes de comprar
async function usuarioTieneDireccion() {
    const token = localStorage.getItem('authToken');
    const res = await fetch('http://127.0.0.1:8000/api/usuario/direccion', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.direccion;
}

// Muestra formulario para capturar dirección
function mostrarFormularioDireccion(onSubmit) {
    let formHtml = `
        <div id="form-direccion-modal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <form id="form-direccion" class="bg-white p-6 rounded shadow-md text-black min-w-[300px]">
                <h2 class="text-lg font-bold mb-2">Datos de dirección</h2>
                <label>Teléfono:<input type="text" name="telefono" class="block w-full mb-2 border" required></label>
                <label>Dirección:<input type="text" name="direccion" class="block w-full mb-2 border" required></label>
                <label>Ciudad:<input type="text" name="ciudad" class="block w-full mb-2 border" required></label>
                <label>Provincia:<input type="text" name="provincia" class="block w-full mb-2 border" required></label>
                <div class="flex gap-2 mt-4">
                    <button type="submit" class="bg-blue-500 text-white px-4 py-1 rounded">Guardar y comprar</button>
                    <button type="button" id="cancelar-direccion" class="bg-gray-400 text-white px-4 py-1 rounded">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('cancelar-direccion').onclick = () => {
        document.getElementById('form-direccion-modal').remove();
    };
    document.getElementById('form-direccion').onsubmit = function(e) {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(this));
        document.getElementById('form-direccion-modal').remove();
        onSubmit(formData);
    };
}

// Modifica comprarCarrito para pedir SIEMPRE dirección
async function comprarCarrito() {
    const mensajeDiv = document.getElementById('carrito-mensaje');
    mensajeDiv.textContent = '';
    mostrarFormularioDireccion(async (direccionData) => {
        await comprarCarritoConDireccion(direccionData);
    });
}

// Nueva función para comprar con datos de dirección opcionales
async function comprarCarritoConDireccion(direccionData = null) {
    const token = localStorage.getItem('authToken');
    const mensajeDiv = document.getElementById('carrito-mensaje');
    mensajeDiv.textContent = '';
    try {
        const res = await fetch('http://127.0.0.1:8000/api/pedidos', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: direccionData ? JSON.stringify({ direccion: direccionData }) : undefined
        });
        const data = await res.json();
        if (res.ok) {
            mensajeDiv.innerHTML = `<span class='text-green-400 font-bold'>¡Pedido realizado! Estado: pendiente</span>`;
            cargarCarrito();
            cargarMisPedidos();
        } else {
            mensajeDiv.innerHTML = `<span class='text-red-400'>${data.message || 'Error al realizar el pedido.'}</span>`;
        }
    } catch (e) {
        mensajeDiv.innerHTML = `<span class='text-red-400'>Error al realizar el pedido.</span>`;
    }
}

// Nueva función para eliminar pedido
async function eliminarPedido(pedidoId) {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/pedidos/${pedidoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            cargarMisPedidos();
        } else {
            alert('No se pudo eliminar el pedido.');
        }
    } catch (e) {
        alert('Error al eliminar el pedido.');
    }
}
