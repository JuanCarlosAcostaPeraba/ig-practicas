import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let camera, scene, renderer, controls
let physicsWorld,
	rigidBodies = []
let transformAux1, clock

const gravityConstant = 9.8
const mouseCoords = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

Ammo().then(() => {
	init()
	animate()
})

function init() {
	initGraphics()
	initPhysics()
	createGround()
	createBooth()
	createTargets()
	initInput()
}

function initGraphics() {
	camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.2,
		2000
	)
	camera.position.set(5, 5, 25)

	scene = new THREE.Scene()
	scene.background = new THREE.Color(0x000022) // Fondo oscuro para simular la noche

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap // Mejora la calidad de las sombras
	document.body.appendChild(renderer.domElement)

	controls = new OrbitControls(camera, renderer.domElement)
	controls.target.set(0, 2, 0)
	controls.update()

	// Ambient light (muy tenue para mantener la sensación de noche)
	const ambientLight = new THREE.AmbientLight(0x202020)
	scene.add(ambientLight)

	// Moonlight (única luz direccional activa)
	const moonLight = new THREE.DirectionalLight(0x809fff, 0.8) // Intensidad ajustada para noche
	moonLight.position.set(-50, 100, -50)
	moonLight.castShadow = true
	moonLight.shadow.mapSize.width = 2048
	moonLight.shadow.mapSize.height = 2048
	moonLight.shadow.camera.near = 0.5
	moonLight.shadow.camera.far = 300
	scene.add(moonLight)

	// Internal lights for the caseta
	const casetaLight1 = new THREE.PointLight(0xffffff, 1.5, 15)
	casetaLight1.position.set(0, 8, -5)
	casetaLight1.castShadow = true
	scene.add(casetaLight1)

	const casetaLight2 = new THREE.PointLight(0xffffff, 1.5, 15)
	casetaLight2.position.set(0, 8, -10)
	casetaLight2.castShadow = true
	scene.add(casetaLight2)

	// Decorative RGB lights with physical bulb effect
	addDecorativeLights()

	// Window resize
	window.addEventListener('resize', onWindowResize)
}

function addDecorativeLights() {
	const rgbColors = [0xff0000, 0x00ff00, 0x0000ff] // Red, Green, Blue
	const bulbSpacing = 2 // Espaciado entre las bombillas
	const bulbRadius = 0.2 // Tamaño de las bombillas

	// Top edge of the frame
	for (let x = -15; x <= 15; x += bulbSpacing) {
		addBulb(new THREE.Vector3(x, 10, 0), rgbColors)
	}

	// Left edge of the frame
	for (let y = 2; y <= 10; y += bulbSpacing) {
		addBulb(new THREE.Vector3(-15, y, 0), rgbColors)
	}

	// Right edge of the frame
	for (let y = 2; y <= 10; y += bulbSpacing) {
		addBulb(new THREE.Vector3(15, y, 0), rgbColors)
	}
}

function addBulb(position, rgbColors) {
	const color = rgbColors[Math.floor(Math.random() * rgbColors.length)]
	const bulbLight = new THREE.PointLight(color, 2, 10) // Increased intensity
	bulbLight.position.copy(position)
	scene.add(bulbLight)

	// Add small sphere to represent the bulb
	const bulbGeometry = new THREE.SphereGeometry(0.2, 8, 8)
	const bulbMaterial = new THREE.MeshBasicMaterial({ color })
	const bulbSphere = new THREE.Mesh(bulbGeometry, bulbMaterial)
	bulbSphere.position.copy(position)
	scene.add(bulbSphere)
}

function initPhysics() {
	const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
	const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
	const broadphase = new Ammo.btDbvtBroadphase()
	const solver = new Ammo.btSequentialImpulseConstraintSolver()
	physicsWorld = new Ammo.btDiscreteDynamicsWorld(
		dispatcher,
		broadphase,
		solver,
		collisionConfiguration
	)
	physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0))

	transformAux1 = new Ammo.btTransform()
	clock = new THREE.Clock()
}

function createGround() {
	const pos = new THREE.Vector3(0, -0.5, 0)
	const quat = new THREE.Quaternion(0, 0, 0, 1)
	const ground = createBoxWithPhysics(
		50,
		1,
		50,
		0,
		pos,
		quat,
		new THREE.MeshPhongMaterial({ color: 0x228b22 })
	)
	ground.receiveShadow = true
}

function createBooth() {
	const boothMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 })
	const sideMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 })

	// Walls
	const wallThickness = 1
	const boothWidth = 30
	const boothHeight = 10
	const boothDepth = 10

	const leftWall = createBoxWithPhysics(
		wallThickness,
		boothHeight,
		boothDepth,
		0,
		new THREE.Vector3(-boothWidth / 2, boothHeight / 2, -5),
		new THREE.Quaternion(0, 0, 0, 1),
		boothMaterial
	)
	const rightWall = createBoxWithPhysics(
		wallThickness,
		boothHeight,
		boothDepth,
		0,
		new THREE.Vector3(boothWidth / 2, boothHeight / 2, -5),
		new THREE.Quaternion(0, 0, 0, 1),
		boothMaterial
	)

	// Back wall
	createBoxWithPhysics(
		boothWidth,
		boothHeight,
		wallThickness,
		0,
		new THREE.Vector3(0, boothHeight / 2, -boothDepth),
		new THREE.Quaternion(0, 0, 0, 1),
		boothMaterial
	)

	// Roof
	createBoxWithPhysics(
		boothWidth,
		wallThickness,
		boothDepth,
		0,
		new THREE.Vector3(0, boothHeight, -boothDepth / 2),
		new THREE.Quaternion(0, 0, 0, 1),
		sideMaterial
	)

	const standHeight = 2.5
	const standDepth = 1
	createBoxWithPhysics(
		boothWidth,
		standHeight,
		standDepth,
		0,
		new THREE.Vector3(0, standHeight / 2, 0.5),
		new THREE.Quaternion(0, 0, 0, 1),
		sideMaterial
	)
}

function createTargets() {
	const targetMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 })
	const repisaMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 })
	const rows = 2
	const columns = 5
	const spacing = 3
	const startX = -(columns / 2) * spacing
	const startY = 3 // Ajuste de altura para que los objetivos estén sobre la repisa
	const repisaHeight = 0.5 // Altura de la repisa
	const repisaDepth = 1 // Profundidad de la repisa

	// Crear repisa para los objetivos
	for (let i = 0; i < rows; i++) {
		const pos = new THREE.Vector3(-0.5, startY + i * 4 - repisaHeight / 2, -8) // Ajustar posición para que soporte las barras
		const quat = new THREE.Quaternion(0, 0, 0, 1)
		createBoxWithPhysics(
			columns * spacing + 10, // Ancho de la repisa
			repisaHeight,
			repisaDepth,
			0,
			pos,
			quat,
			repisaMaterial
		)
	}

	// Crear objetivos sobre la repisa
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < columns; j++) {
			const pos = new THREE.Vector3(startX + j * spacing, startY + i * 4, -8) // Posición ajustada para estar sobre la repisa
			const quat = new THREE.Quaternion(0, 0, 0, 1)
			const target = createBoxWithPhysics(
				1, // Ancho del objetivo
				2, // Altura del objetivo
				1, // Profundidad del objetivo
				5,
				pos,
				quat,
				targetMaterial
			)
			target.castShadow = true
		}
	}
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
	const object = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material)
	object.position.copy(pos)
	object.quaternion.copy(quat)

	const shape = new Ammo.btBoxShape(
		new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
	)
	shape.setMargin(0.05)

	const transform = new Ammo.btTransform()
	transform.setIdentity()
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
	const motionState = new Ammo.btDefaultMotionState(transform)

	const localInertia = new Ammo.btVector3(0, 0, 0)
	shape.calculateLocalInertia(mass, localInertia)

	const rbInfo = new Ammo.btRigidBodyConstructionInfo(
		mass,
		motionState,
		shape,
		localInertia
	)
	const body = new Ammo.btRigidBody(rbInfo)

	if (mass > 0) {
		rigidBodies.push(object)
		body.setActivationState(4)
	}

	object.userData.physicsBody = body
	scene.add(object)
	physicsWorld.addRigidBody(body)

	return object
}

function initInput() {
	window.addEventListener('pointerdown', (event) => {
		mouseCoords.set(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		)
		raycaster.setFromCamera(mouseCoords, camera)

		const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff })
		const ballRadius = 0.5
		const ball = new THREE.Mesh(
			new THREE.SphereGeometry(ballRadius, 14, 10),
			ballMaterial
		)
		ball.castShadow = true

		const ballShape = new Ammo.btSphereShape(ballRadius)
		ballShape.setMargin(0.05)

		const pos = new THREE.Vector3()
		pos.copy(raycaster.ray.direction)
		pos.add(raycaster.ray.origin)

		const quat = new THREE.Quaternion(0, 0, 0, 1)
		const ballBody = createRigidBody(ball, ballShape, 20, pos, quat)

		pos.copy(raycaster.ray.direction)
		pos.multiplyScalar(20)
		ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z))
	})
}

function createRigidBody(object, shape, mass, pos, quat) {
	const transform = new Ammo.btTransform()
	transform.setIdentity()
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
	const motionState = new Ammo.btDefaultMotionState(transform)

	const localInertia = new Ammo.btVector3(0, 0, 0)
	shape.calculateLocalInertia(mass, localInertia)

	const rbInfo = new Ammo.btRigidBodyConstructionInfo(
		mass,
		motionState,
		shape,
		localInertia
	)
	const body = new Ammo.btRigidBody(rbInfo)

	object.userData.physicsBody = body
	scene.add(object)

	if (mass > 0) rigidBodies.push(object)

	physicsWorld.addRigidBody(body)

	return body
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
	requestAnimationFrame(animate)

	const deltaTime = clock.getDelta()
	updatePhysics(deltaTime)

	renderer.render(scene, camera)
}

function updatePhysics(deltaTime) {
	physicsWorld.stepSimulation(deltaTime, 10)

	for (const obj of rigidBodies) {
		const objPhys = obj.userData.physicsBody
		const ms = objPhys.getMotionState()

		if (ms) {
			ms.getWorldTransform(transformAux1)
			const p = transformAux1.getOrigin()
			const q = transformAux1.getRotation()

			obj.position.set(p.x(), p.y(), p.z())
			obj.quaternion.set(q.x(), q.y(), q.z(), q.w())

			if (!obj.userData.collided && obj.position.y < 0) {
				if (obj.userData.onCollide) obj.userData.onCollide()
				obj.userData.collided = true
			}
		}
	}
}
