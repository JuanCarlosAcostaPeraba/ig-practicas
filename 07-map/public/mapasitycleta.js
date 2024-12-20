import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let scene, renderer, camera, camcontrols
let mapa, mapsx, mapsy

// Latitud y longitud de los extremos del mapa de la imagen
let minlon = -15.5304,
	maxlon = -15.3656
let minlat = 28.0705,
	maxlat = 28.1817
// Dimensiones textura (mapa)
let txwidth, txheight

let objetos = []

const gui = new GUI()
const params = {
	velocidad: 1, // Minutos simulados por segundo real
	temperatura: false, // Mostrar temperatura
}

// Formatea y muestra la fecha actual en la pantalla
const opciones = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	timeZoneName: 'short',
}

const temperatureToast = document.getElementById('temperature')

const WEATHER_API =
	'https://api.open-meteo.com/v1/forecast?latitude=28.0997&longitude=-15.4134&daily=temperature_2m_max,temperature_2m_min&start_date=2024-09-01&end_date=2024-10-31'

// Variables de simulación
let velocidadSimulacion = params.velocidad

//Datos fecha, estaciones, préstamos
const fechaInicio = new Date(2024, 8, 1)
let fechaActual
let totalMinutos = 0,
	fecha2show
const datosSitycleta = [],
	datosEstaciones = []

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

init()
animate()

function init() {
	//Muestra fecha como título
	fecha2show = document.createElement('div')
	fecha2show.style.position = 'absolute'
	fecha2show.style.top = '30px'
	fecha2show.style.width = '100%'
	fecha2show.style.textAlign = 'center'
	fecha2show.style.color = '#000'
	fecha2show.style.fontWeight = 'bold'
	fecha2show.style.backgroundColor = 'transparent'
	fecha2show.style.zIndex = '1'
	fecha2show.style.fontFamily = 'Monospace'
	fecha2show.innerHTML = ''
	document.body.appendChild(fecha2show)

	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	//Posición de la cámara
	camera.position.z = 3

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	camcontrols = new OrbitControls(camera, renderer.domElement)

	gui
		.add(params, 'velocidad', 1, 60, 1)
		.name('Velocidad (min/s)')
		.onChange((value) => actualizarVelocidad(value))

	gui
		.add(params, 'temperatura')
		.name('Mostrar temperatura')
		.onChange(toggleTemperatura)

	//Objeto sobre el que se mapea la textura del mapa
	//Dimensiones por defecto
	mapsx = 5
	mapsy = 5
	Plano(0, 0, 0, mapsx, mapsy)

	//CARGA TEXTURA (MAPA)
	//Ajusta tamalño del plano al de la textura, manteniendo relación de aspecto
	const tx1 = new THREE.TextureLoader().load(
		'https://cdn.glitch.global/341720a6-447a-46ce-b3c9-8002f2955b61/mapaLPGC.png?v=1697723131403',

		// Acciones a realizar tras la carga
		function (texture) {
			//Dimensiones, textura
			//console.log(texture.image.width, texture.image.height);
			mapa.material.map = texture
			mapa.material.needsUpdate = true

			txwidth = texture.image.width
			txheight = texture.image.height

			//Adapta dimensiones del plano a la textura, manteniendo proporciones
			if (txheight > txwidth) {
				let factor = txheight / txwidth
				mapa.scale.set(1, factor, 1)
				mapsy *= factor
			} else {
				let factor = txwidth / txheight
				mapa.scale.set(factor, 1, 1)
				mapsx *= factor
			}
		}
	)

	//CARGA DE DATOS
	//Lectura del archivo csv de las estaciones Sitycleta
	fetch('Geolocalización estaciones sitycleta.csv')
		.then((response) => {
			if (!response.ok) {
				throw new Error('Error: ' + response.statusText)
			}
			return response.text()
		})
		.then((content) => {
			procesarCSVEstaciones(content)
		})
		.catch((error) => {
			console.error('Error al cargar el archivo:', error)
		})

	function procesarCSVEstaciones(content) {
		const sep = ';' // separador ;
		const filas = content.split('\n')

		// Primera fila es el encabezado, separador ;
		const encabezados = filas[0].split(sep)

		// Obtiene índices de columnas de interés
		const indices = {
			id: encabezados.indexOf('idbase'),
			nombre: encabezados.indexOf('nombre'),
			lat: encabezados.indexOf('latitud'),
			lon: encabezados.indexOf('altitud'),
		}

		// Extrae los datos de interés
		for (let i = 1; i < filas.length; i++) {
			const columna = filas[i].split(sep) // separador ;
			if (columna.length > 1) {
				// No fila vacía
				datosEstaciones.push({
					id: columna[indices.idbase],
					nombre: columna[indices.nombre],
					lat: columna[indices.lat],
					lon: columna[indices.lon],
				})

				//longitudes crecen hacia la derecha, como la x
				let mlon = Mapeo(
					columna[indices.lon],
					minlon,
					maxlon,
					-mapsx / 2,
					mapsx / 2
				)
				//Latitudes crecen hacia arriba, como la y
				let mlat = Mapeo(
					columna[indices.lat],
					minlat,
					maxlat,
					-mapsy / 2,
					mapsy / 2
				)
				Esfera(mlon, mlat, 0, 0.01, 10, 10, 0xff0000, {
					id: columna[indices.id],
					nombre: columna[indices.nombre],
					lat: columna[indices.lat],
					lon: columna[indices.lon],
				})
			}
		}
		console.log('Archivo csv estaciones cargado')
	}

	fetch('SITYCLETA-2024.csv')
		.then((response) => {
			if (!response.ok) {
				throw new Error('Error: ' + response.statusText)
			}
			return response.text()
		})
		.then((content) => {
			procesarCSVAlquileres(content)
		})
		.catch((error) => {
			console.error('Error al cargar el archivo:', error)
		})

	function procesarCSVAlquileres(content) {
		const sep = ';' // separador ;
		const filas = content.split('\n')

		// Primera fila es el encabezado, separador ;
		const encabezados = filas[0].split(sep)

		// Obtiene índices de columnas de interés
		const indices = {
			t_inicio: encabezados.indexOf('Start'),
			t_fin: encabezados.indexOf('End'),
			p_inicio: encabezados.indexOf('Rental place'),
			p_fin: encabezados.indexOf('Return place'),
		}

		// Extrae los datos de interés
		for (let i = 1; i < filas.length; i++) {
			const columna = filas[i].split(sep)
			if (columna.length > 1) {
				// No fila vacía
				datosSitycleta.push({
					t_inicio: convertirFecha(columna[indices.t_inicio]),
					t_fin: convertirFecha(columna[indices.t_fin]),
					p_inicio: columna[indices.p_inicio],
					p_fin: columna[indices.p_fin],
				})
			}
		}
		console.log('Archivo csv alquileres cargado')
	}

	window.addEventListener('click', clickEnEsfera)
	window.addEventListener('resize', resizeWindow)
}

function clickEnEsfera(event) {
	// Calcular la posición del clic en el espacio normalizado
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

	// Raycasting para detectar el objeto
	raycaster.setFromCamera(mouse, camera)
	const intersects = raycaster.intersectObjects(objetos)

	if (intersects.length > 0) {
		const selectedObject = intersects[0].object
		mostrarToast(selectedObject.userData)
	}
}

function obtenerTemperaturas(fecha, data) {
	const fechaFormato = fecha.toISOString().split('T')[0]

	const resultado = data.find((dia) => dia.date === fechaFormato)

	return resultado
}

function mostrarToast(estacion) {
	const toast = document.getElementById('toast')
	toast.innerHTML = `
			<strong>${estacion.nombre}</strong><br>
			ID: ${estacion.id}<br>
			Lat: ${estacion.lat}<br>
			Lon: ${estacion.lon}
	`
	toast.classList.add('show')
	toast.style.display = 'block'

	// Ocultar el toast después de 3 segundos
	setTimeout(() => {
		toast.classList.remove('show')
		setTimeout(() => {
			toast.style.display = 'none'
		}, 300) // Tiempo del fade-out
	}, 5000)
}

//valor, rango origen, rango destino
function Mapeo(val, vmin, vmax, dmin, dmax) {
	//Normaliza valor en el rango de partida, t=0 en vmin, t=1 en vmax
	let t = 1 - (vmax - val) / (vmax - vmin)
	return dmin + t * (dmax - dmin)
}

function Esfera(px, py, pz, radio, nx, ny, col, estacion) {
	let geometry = new THREE.SphereBufferGeometry(radio, nx, ny)
	let material = new THREE.MeshBasicMaterial({
		color: col,
	})
	let mesh = new THREE.Mesh(geometry, material)
	mesh.position.set(px, py, pz)
	mesh.userData = estacion // Asignar datos de la estación
	objetos.push(mesh)
	scene.add(mesh)
}

function Plano(px, py, pz, sx, sy) {
	let geometry = new THREE.PlaneBufferGeometry(sx, sy)
	let material = new THREE.MeshBasicMaterial({})
	let mesh = new THREE.Mesh(geometry, material)
	mesh.position.set(px, py, pz)
	scene.add(mesh)
	mapa = mesh
}

// Función para convertir una fecha en formato DD/MM/YYYY HH:mm, presenmte en archivo de préstamos, a Date
function convertirFecha(fechaStr) {
	const [fecha, hora] = fechaStr.split(' ')
	const [dia, mes, año] = fecha.split('/').map(Number)
	const [horas, minutos] = hora.split(':').map(Number)
	return new Date(año, mes - 1, dia, horas, minutos) // mes es 0-indexado
}

// Función para actualizar la velocidad de simulación
function actualizarVelocidad(nuevaVelocidad) {
	velocidadSimulacion = nuevaVelocidad // Ajusta la nueva velocidad
}

// Función para mostrar u ocultar la temperatura
function toggleTemperatura() {
	if (params.temperatura) {
		obtenerTemperatura()
	} else {
		temperatureToast.classList.remove('show')
	}
}

function mostrarTemperatura(data) {
	const temperaturasDia = obtenerTemperaturas(fechaActual, data)

	const { max, min } = temperaturasDia

	temperatureToast.innerHTML = `
		<strong>Temperatura</strong><br>
		<span id="date">Día:</span><br>
		Máxima: ${max}°C<br>
		Mínima: ${min}°C
	`
	temperatureToast.classList.add('show')
}

function obtenerTemperatura() {
	fetch(WEATHER_API)
		.then((response) => {
			if (!response.ok) {
				throw new Error('Error: ' + response.statusText)
			}
			return response.json()
		})
		.then((data) => {
			const maxTemp = data.daily.temperature_2m_max
			const minTemp = data.daily.temperature_2m_min
			const days = data.daily.time
			// loop to create a new json object with the date and the max and min temperature for each day
			const tempData = days.map((day, index) => {
				return {
					date: day,
					max: maxTemp[index],
					min: minTemp[index],
				}
			})

			mostrarTemperatura(tempData)
		})
		.catch((error) => {
			console.error('Error al obtener la temperatura:', error)
		})
}

// Modifica la función actualizarFecha para que utilice la velocidad de simulación
function actualizarFecha() {
	// Calcula los minutos a avanzar según la velocidad de simulación
	totalMinutos += velocidadSimulacion

	// Suma esos minutos a la fecha inicial para obtener la fecha actual
	fechaActual = new Date(fechaInicio.getTime() + totalMinutos * 60000)

	fecha2show.innerHTML = fechaActual.toLocaleString('es-ES', opciones)
	const temperatureDate = document.getElementById('date')
	if (temperatureDate) {
		temperatureDate.innerHTML = fechaActual
			.toLocaleString('es-ES', opciones)
			.split(',')[0]

		actualizarTemperatura()
	}
}

function actualizarTemperatura() {
	if (params.temperatura) {
		obtenerTemperatura()
	} else {
		temperatureToast.classList.remove('show')
	}
}

function filtraparadasActivas() {
	//Filtra registros activos
	const registrosFiltrados = datosSitycleta.filter((registro) => {
		return registro.t_inicio <= fechaActual && registro.t_fin >= fechaActual
	})

	//Hay alquileres activos a esa hora
	if (registrosFiltrados.length > 0) {
		//Parada de inicio de alquileres activos
		const estacionesA = new Set(
			registrosFiltrados.map((registro) => registro.p_inicio)
		)
		//Parada de fin de alquileres activos
		const estacionesB = new Set(
			registrosFiltrados.map((registro) => registro.p_fin)
		)

		let i = 0
		//Altera aspecto de las estaciones con alquiler activo, o lo recupera
		for (const estacion of datosEstaciones) {
			if (
				estacionesA.has(estacion.nombre) ||
				estacionesB.has(estacion.nombre)
			) {
				//Varío color según casos
				if (
					estacionesA.has(estacion.nombre) &&
					estacionesB.has(estacion.nombre)
				)
					objetos[i].material.color.set(0x00ffff)
				else {
					if (estacionesA.has(estacion.nombre))
						objetos[i].material.color.set(0x00ff00)
					else objetos[i].material.color.set(0x0000ff)
				}
				objetos[i].scale.set(2, 2, 2)
			} else {
				objetos[i].material.color.set(0xff0000)
				objetos[i].scale.set(1, 1, 1)
			}
			i++
		}
	}
}

// Actualiza tamaño de la ventana
function resizeWindow() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

//Bucle de animación
function animate() {
	actualizarFecha()
	filtraparadasActivas()

	requestAnimationFrame(animate)
	renderer.render(scene, camera)
}
