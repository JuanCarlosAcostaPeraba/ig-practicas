import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Global variables
let scene, renderer
let camera
let info
let grid
let star,
	Planets = [],
	Moons = []
let comets = []
let cometsPath = []
let t0 = 0
let accglobal = 0.001
let timestamp

let pause = 0

let modeValue = 0
const mode = document.getElementById('mode')
const gridState = document.getElementById('off')

const cameraInitialPosition = new THREE.Vector3(0, -50, 30)

const loadingBar = document.getElementById('loading-bar')
const loadingText = document.getElementById('loading-text')

const loadingMessages = [
	'Cargando el sistema solar...',
	'Calculando la velocidad de la luz...',
	'Ocurriendo el Big Bang...',
	'Alineando los planetas...',
	'Preparando el viaje espacial...',
	'Sintiendo la gravedad...',
	'Evitando agujeros negros...',
	'Configurando órbitas...',
]

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
	SATURN_RING_ALPHA:
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
	HAUMEA:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/haumea.jpg',
}

function simulateLoading() {
	let progress = 0
	const duration = 10000
	const intervalTime = duration / loadingMessages.length

	const loadingInterval = setInterval(() => {
		progress += 100 / loadingMessages.length
		loadingBar.style.width = `${progress}%`

		const messageIndex = Math.floor((progress / 150) * loadingMessages.length)
		loadingText.textContent =
			loadingMessages[messageIndex] || 'Cargando el sistema solar...'

		if (progress >= 100) {
			clearInterval(loadingInterval)
			loadingText.textContent = '¡Listo para explorar el universo!'
			setTimeout(() => {
				document.getElementById('loading-container').style.display = 'none'
				init()
				animationLoop()
			}, 1000)
		}
	}, intervalTime)
}

simulateLoading()

function init() {
	// Define camera
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1500
	)
	camera.position.copy(cameraInitialPosition)

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	let camcontrols = new OrbitControls(camera, renderer.domElement)

	const textureLoader = new THREE.TextureLoader()
	const starTexture = textureLoader.load(TEXTURE.STARS_MILKY_WAY)

	// Create star background (milky way)
	const sphereGeometry = new THREE.SphereGeometry(1000, 60, 40)
	const sphereMaterial = new THREE.MeshBasicMaterial({
		map: starTexture,
		side: THREE.BackSide,
	})
	const starBackground = new THREE.Mesh(sphereGeometry, sphereMaterial)
	scene.add(starBackground)

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
	Planet(1.2, 143.0, 0.3, 1.0, 1.0, TEXTURE.SATURN, TEXTURE.SATURN_RING_ALPHA) // Saturn
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
	document.getElementById('onoff').addEventListener('click', (event) => {
		event.preventDefault()
		grid.visible = !grid.visible
		gridState.innerHTML = grid.visible ? 'on' : 'off'
	})

	// Reset camera
	document.getElementById('reset').addEventListener('click', (event) => {
		event.preventDefault()
		camera.position.copy(cameraInitialPosition)
		camera.lookAt(0, 0, 0)
	})

	// Switch mode (move / add comets)
	document.getElementById('switch').addEventListener('click', (event) => {
		event.preventDefault()
		if (modeValue === 0) {
			modeValue = 1
			mode.innerHTML = 'añadir cometas'
			document.addEventListener('click', onMouseClick)
			camcontrols.enabled = false
		} else {
			modeValue = 0
			mode.innerHTML = 'moverse'
			document.removeEventListener('click', onMouseClick)
			camcontrols.enabled = true
		}
	})

	// Pause / Resume
	document.getElementById('pause').addEventListener('click', (event) => {
		event.preventDefault()
		if (pause === 0) {
			pause = 1
			document.getElementById('pause').innerHTML = 'Reanudar'
		} else {
			pause = 0
			document.getElementById('pause').innerHTML = 'Pausar tiempo'
		}
	})

	// Resize event
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
	})
}

// Create a comet
function Comet(init, vel) {
	const radio = 0.2
	let geom = new THREE.SphereGeometry(radio, 32, 32)
	let mat = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load(TEXTURE.HAUMEA),
	})
	let comet = new THREE.Mesh(geom, mat)
	comet.position.copy(init)
	comet.userData.vel = vel

	scene.add(comet)
	comets.push(comet)

	cometsPath.push([comet.position.clone()])

	const pathGeometry = new THREE.BufferGeometry()
	const pathMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
	const cometTrail = new THREE.Line(pathGeometry, pathMaterial)
	scene.add(cometTrail)
	comet.userData.trail = cometTrail
}

// Event to create comets
function onMouseClick(event) {
	const mouse = new THREE.Vector2()
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1
	mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1

	const raycaster = new THREE.Raycaster()
	raycaster.setFromCamera(mouse, camera)

	const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
	const intersectPoint = new THREE.Vector3()
	raycaster.ray.intersectPlane(planeZ, intersectPoint)

	const randomVelocity = new THREE.Vector3(
		(Math.random() - 0.5) * 0.1,
		(Math.random() - 0.5) * 0.1,
		(Math.random() - 0.5) * 0.1
	)

	Comet(intersectPoint, randomVelocity)
}

// Draw star
function Star(rad, texture) {
	let geometry = new THREE.SphereGeometry(rad, 32, 32)
	let material = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load(texture),
	})
	star = new THREE.Mesh(geometry, material)
	scene.add(star)
}

// Draw planet
function Planet(radio, dist, vel, f1, f2, texture, ringsTexture) {
	let geom = new THREE.SphereGeometry(radio, 32, 32)
	// rotate the texture
	geom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
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

	if (ringsTexture) {
		const ringGeometry = new THREE.RingGeometry(radio * 1.5, radio * 2.5, 64)
		const ringMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load(ringsTexture),
			side: THREE.DoubleSide,
			transparent: true,
		})

		const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)

		ringMesh.rotation.x = Math.PI / 2
		planet.add(ringMesh)
	}

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
	if (texture) {
		mat = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load(texture),
		})
	} else {
		mat = new THREE.MeshBasicMaterial({
			color: col,
		})
	}
	let luna = new THREE.Mesh(geom, mat)
	luna.userData.dist = dist
	luna.userData.speed = vel

	Moons.push(luna)
	pivote.add(luna)
}

function animationLoop() {
	timestamp = (Date.now() - t0) * accglobal

	requestAnimationFrame(animationLoop)

	if (!pause) {
		// Move planets in their orbits
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

		// Move moons in their orbits
		for (let object of Moons) {
			object.position.x =
				Math.cos(timestamp * object.userData.speed) * object.userData.dist
			object.position.y =
				Math.sin(timestamp * object.userData.speed) * object.userData.dist
		}

		// Update comets position
		comets.forEach((comet, index) => {
			comet.position.add(comet.userData.vel)

			// Update comet path
			cometsPath[index].push(comet.position.clone())
			if (cometsPath[index].length > 50) {
				cometsPath[index].shift()
			}

			// Update comet trail
			const pathGeometry = comet.userData.trail.geometry
			pathGeometry.setFromPoints(cometsPath[index])
		})
	}

	renderer.render(scene, camera)
}
