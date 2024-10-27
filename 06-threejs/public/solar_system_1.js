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
	URANUS:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/uranus.jpg',
	NEPTUNE:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/neptune.jpg',
	PLUTO:
		'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/pluto.jpg',
	MOON: 'https://raw.githubusercontent.com/JuanCarlosAcostaPeraba/ig-practicas/refs/heads/main/06-threejs/assets/moon.jpg',
}

init()
animationLoop()

function init() {
	info = document.createElement('div')
	info.style.position = 'absolute'
	info.style.top = '30px'
	info.style.width = '100%'
	info.style.textAlign = 'center'
	info.style.color = '#fff'
	info.style.fontWeight = 'bold'
	info.style.backgroundColor = 'transparent'
	info.style.zIndex = '1'
	info.style.fontFamily = 'Monospace'
	info.innerHTML = 'three.js - Sistema Solar'
	document.body.appendChild(info)

	// Define camera
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.set(0, -50, 30)

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	let camcontrols = new OrbitControls(camera, renderer.domElement)

	// Grid
	grid = new THREE.GridHelper(900, 100)
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
