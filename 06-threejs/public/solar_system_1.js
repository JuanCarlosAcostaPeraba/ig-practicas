import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let scene, renderer
let camera
let info
let grid
let estrella,
	Planetas = [],
	Lunas = []
let t0 = 0
let accglobal = 0.001
let timestamp

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

	// Definir cámara
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.set(0, 0, 50)

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	let camcontrols = new OrbitControls(camera, renderer.domElement)

	// Rejilla de referencia
	grid = new THREE.GridHelper(900, 100)
	grid.geometry.rotateX(Math.PI / 2)
	grid.position.set(0, 0, 0.05)
	grid.visible = false
	scene.add(grid)

	// Crear Sol
	Estrella(3.5, 0xffff00)

	// Crear planetas
	Planeta(0.3, 8.0, 1.6, 0xa8a8a8, 1.0, 1.0) // Mercurio
	Planeta(0.6, 10.8, 1.2, 0xffd700, 1.0, 1.0) // Venus
	Planeta(0.7, 14.9, 1.0, 0x00ff00, 1.0, 1.0) // Tierra
	Planeta(0.35, 22.7, 0.8, 0xff4500, 1.0, 1.0) // Marte
	Planeta(1.5, 78.3, 0.4, 0xffa500, 1.0, 1.0) // Júpiter
	Planeta(1.2, 143.0, 0.3, 0xfff5ee, 1.0, 1.0) // Saturno
	Planeta(1.0, 287.0, 0.2, 0x1e90ff, 1.0, 1.0) // Urano
	Planeta(0.9, 450.0, 0.1, 0x0000ff, 1.0, 1.0) // Neptuno

	// Crear lunas
	Luna(Planetas[2], 0.1, 1.0, 1.5, 0xffffff, 0) // Luna de la Tierra
	Luna(Planetas[4], 0.3, 2.0, 0.6, 0xdcdcdc, 0) // Io
	Luna(Planetas[4], 0.25, 3.0, 0.5, 0xb0c4de, 0.5) // Europa
	Luna(Planetas[4], 0.35, 4.0, 0.4, 0xf0e68c, 1.0) // Ganimedes
	Luna(Planetas[5], 0.4, 3.5, 0.6, 0xffd700, 0) // Titán

	// Iniciar tiempo
	t0 = Date.now()

	// Mostrar/Ocultar rejilla
	document.getElementById('onoff').addEventListener('click', function () {
		grid.visible = !grid.visible
	})
}

function Estrella(rad, col) {
	let geometry = new THREE.SphereGeometry(rad, 32, 32)
	let material = new THREE.MeshBasicMaterial({ color: col })
	estrella = new THREE.Mesh(geometry, material)
	scene.add(estrella)
}

function Planeta(radio, dist, vel, col, f1, f2) {
	let geom = new THREE.SphereGeometry(radio, 32, 32)
	let mat = new THREE.MeshBasicMaterial({ color: col })
	let planeta = new THREE.Mesh(geom, mat)
	planeta.userData.dist = dist
	planeta.userData.speed = vel
	planeta.userData.f1 = f1
	planeta.userData.f2 = f2

	Planetas.push(planeta)
	scene.add(planeta)

	// Dibuja trayectoria
	let curve = new THREE.EllipseCurve(0, 0, dist * f1, dist * f2)
	let points = curve.getPoints(50)
	let geome = new THREE.BufferGeometry().setFromPoints(points)
	let mate = new THREE.LineBasicMaterial({ color: 0xffffff })
	let orbita = new THREE.Line(geome, mate)
	scene.add(orbita)
}

function Luna(planeta, radio, dist, vel, col, angle) {
	let pivote = new THREE.Object3D()
	pivote.rotation.x = angle
	planeta.add(pivote)

	let geom = new THREE.SphereGeometry(radio, 32, 32)
	let mat = new THREE.MeshBasicMaterial({ color: col })
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
	for (let object of Planetas) {
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
