import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Global variables
let scene, renderer
let camera
let info
let grid
let star,
	Planets = [],
	Lunas = []
let t0 = 0
let accglobal = 0.001
let timestamp

const mode = document.getElementById('mode')
let modeValue = 0

const cameraInitialPosition = new THREE.Vector3(0, -50, 30)

// Texture paths
const TEXTURE = {
	SUN: 'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/sun.jpg',
	MERCURY:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/mercury.jpg',
	VENUS:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/venus.jpg',
	EARTH:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/earth.jpg',
	MARS: 'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/mars.jpg',
	JUPITER:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/jupiter.jpg',
	SATURN:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/saturn.jpg',
	SATRUN_RING_ALPHA:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/saturn_ring_alpha.png',
	URANUS:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/uranus.jpg',
	NEPTUNE:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/neptune.jpg',
	PLUTO:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/pluto.jpg',
	MOON: 'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/moon.jpg',
	STARS:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/stars.jpg',
	STARS_MILKY_WAY:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/stars_milky_way.jpg',
}

init()
animationLoop()

function init() {
	// Define camera
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		3000
	)
	camera.position.copy(cameraInitialPosition)

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	let camcontrols = new OrbitControls(camera, renderer.domElement)

	// Grid
	grid = new THREE.GridHelper(2000, 100)
	grid.geometry.rotateX(Math.PI / 2)
	grid.position.set(0, 0, 0.05)
	grid.visible = false
	scene.add(grid)

	// Create Sun
	Star(3.5, TEXTURE.SUN)

	// Create Planets
	Planet(0.3, 8.0, 1.6, 1.0, 1.0, TEXTURE.MERCURY) // Mercury
	Planet(0.6, 10.8, 1.2, 1.0, 1.0, TEXTURE.VENUS) // Venus
	Planet(0.7, 14.9, 1.0, 1.0, 1.0, TEXTURE.EARTH) // Earth
	Planet(0.35, 22.7, 0.8, 1.0, 1.0, TEXTURE.MARS) // Mars
	Planet(1.5, 78.3, 0.4, 1.0, 1.0, TEXTURE.JUPITER) // Jupiter
	Planet(1.2, 143.0, 0.3, 1.0, 1.0, TEXTURE.SATURN) // Saturn
	Planet(1.0, 287.0, 0.2, 1.0, 1.0, TEXTURE.URANUS) // Uranus
	Planet(0.9, 450.0, 0.1, 1.0, 1.0, TEXTURE.NEPTUNE) // Neptune
	Planet(0.3, 590.0, 0.05, 1.0, 1.0, TEXTURE.PLUTO) // Pluto

	// Create Moons
	Moon(Planets[2], 0.1, 1.0, 1.5, 0xffffff, 0, TEXTURE.MOON) // Moon
	Moon(Planets[4], 0.3, 2.0, 0.6, 0xdcdcdc, 0) // Io
	Moon(Planets[4], 0.25, 3.0, 0.5, 0xb0c4de, 0.5) // Europa
	Moon(Planets[4], 0.35, 4.0, 0.4, 0xf0e68c, 1.0) // Ganymede
	Moon(Planets[5], 0.4, 3.5, 0.6, 0xffd700, 0) // Titan

	// Start time
	t0 = Date.now()

	// Show/hide grid
	document.getElementById('onoff').addEventListener('click', function () {
		grid.visible = !grid.visible
	})

	// Reset camera
	document.getElementById('reset').addEventListener('click', resetCamera, false)

	// Switch mode (move / add comets)
	document.getElementById('switch').addEventListener('click', function () {
		if (modeValue === 0) {
			modeValue = 1
			mode.innerHTML = 'Añadir cometas'
			window.addEventListener('click', onMouseClick)
		} else {
			modeValue = 0
			mode.innerHTML = 'Mover'
			window.removeEventListener('click', onMouseClick)
		}
	})

	// Resize event
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	})
}

// Reset camera
function resetCamera() {
	camera.position.copy(cameraInitialPosition)
	camera.lookAt(0, 0, 0)
}

// Create a comet
function crearCometa(x, y, z) {
	const cometaGeom = new THREE.SphereGeometry(0.2, 16, 16) // Núcleo del cometa
	const cometaMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
	const cometa = new THREE.Mesh(cometaGeom, cometaMaterial)

	// Posición inicial del cometa
	cometa.position.set(x, y, z)
	scene.add(cometa)

	// Crear cola del cometa usando un BufferGeometry
	const colaMaterial = new THREE.PointsMaterial({
		color: 0xaaaaaa,
		size: 0.3,
		transparent: true,
		opacity: 0.5,
	})

	const colaGeom = new THREE.BufferGeometry()
	const positions = new Float32Array(100 * 3) // 100 partículas en la cola
	colaGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
	const cola = new THREE.Points(colaGeom, colaMaterial)
	cometa.add(cola)

	// Variables para controlar la cola
	const colaLength = 100 // Longitud de la cola
	let colaIndex = 0 // Índice actual de la cola
	const colaPositions = new Float32Array(colaLength * 3) // Almacenar las posiciones de la cola

	// Generar una dirección aleatoria para el movimiento
	const direccion = new THREE.Vector3(
		Math.random() * 0.1 - 0.05,
		Math.random() * 0.1 - 0.05,
		Math.random() * 0.1 - 0.05
	)

	// Animación para mover el cometa y actualizar la cola
	function moverCometa() {
		// Mover el cometa
		cometa.position.add(direccion)

		// Actualizar la posición de la cola
		colaPositions[colaIndex * 3] = cometa.position.x // x
		colaPositions[colaIndex * 3 + 1] = cometa.position.y // y
		colaPositions[colaIndex * 3 + 2] = cometa.position.z // z

		colaIndex = (colaIndex + 1) % colaLength // Actualizar índice de cola
		cola.geometry.attributes.position.needsUpdate = true // Marcar como actualizado
		cola.geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(colaPositions, 3)
		)

		requestAnimationFrame(moverCometa)
	}
	moverCometa()
}

// Manejo de clic del mouse
function onMouseClick(event) {
	const mouse = new THREE.Vector2()
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

	const raycaster = new THREE.Raycaster()
	raycaster.setFromCamera(mouse, camera)
	const intersects = raycaster.intersectObjects(scene.children, true)

	if (intersects.length > 0) {
		const { x, y, z } = intersects[0].point
		crearCometa(x, y, z)
	}
}

function Star(rad, texture) {
	let geometry = new THREE.SphereGeometry(rad, 32, 32)
	let material = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load(texture),
	})
	star = new THREE.Mesh(geometry, material)
	scene.add(star)
}

function Planet(radio, dist, vel, f1, f2, texture) {
	let geom = new THREE.SphereGeometry(radio, 32, 32)
	let mat = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load(texture),
	})
	let planet = new THREE.Mesh(geom, mat)
	planet.userData.dist = dist
	planet.userData.speed = vel
	planet.userData.f1 = f1
	planet.userData.f2 = f2

	Planets.push(planet)
	scene.add(planet)

	// Draw orbit
	let curve = new THREE.EllipseCurve(0, 0, dist * f1, dist * f2)
	let points = curve.getPoints(50)
	let geometry = new THREE.BufferGeometry().setFromPoints(points)
	let mate = new THREE.LineBasicMaterial({ color: 0xffffff })
	let orbit = new THREE.Line(geometry, mate)
	scene.add(orbit)
}

// Draw moon
function Moon(planet, radio, dist, vel, col, angle, texture) {
	let pivote = new THREE.Object3D()
	pivote.rotation.x = angle
	planet.add(pivote)

	let geom = new THREE.SphereGeometry(radio, 32, 32)
	let mat
	if (texture === undefined) {
		mat = new THREE.MeshBasicMaterial({
			color: col,
		})
	} else {
		mat = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load(texture),
		})
	}
	let luna = new THREE.Mesh(geom, mat)
	luna.userData.dist = dist
	luna.userData.speed = vel

	Lunas.push(luna)
	pivote.add(luna)
}

function animationLoop() {
	timestamp = (Date.now() - t0) * accglobal

	requestAnimationFrame(animationLoop)

	// Mover planetas en sus órbitas
	for (let object of Planets) {
		object.position.x =
			Math.cos(timestamp * object.userData.speed) *
			object.userData.f1 *
			object.userData.dist
		object.position.y =
			Math.sin(timestamp * object.userData.speed) *
			object.userData.f2 *
			object.userData.dist
	}

	// Mover lunas en sus órbitas
	for (let object of Lunas) {
		object.position.x =
			Math.cos(timestamp * object.userData.speed) * object.userData.dist
		object.position.y =
			Math.sin(timestamp * object.userData.speed) * object.userData.dist
	}

	renderer.render(scene, camera)
}
