import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let camera, scene, renderer, controls
let physicsWorld,
	rigidBodies = []
let transformAux1, clock
let isPlaying = false

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
	createPlayButton()
}

function createPlayButton() {
	const button = document.createElement('button')
	button.innerText = 'Play'
	button.style.position = 'absolute'
	button.style.bottom = '20px'
	button.style.left = '50%'
	button.style.transform = 'translateX(-50%)'
	button.style.padding = '10px 20px'
	button.style.fontSize = '18px'
	button.style.backgroundColor = '#4CAF50'
	button.style.color = 'white'
	button.style.border = 'none'
	button.style.borderRadius = '5px'
	button.style.cursor = 'pointer'
	button.addEventListener('click', () => {
		button.style.display = 'none'
		startGame()
	})
	document.body.appendChild(button)
}

function startGame() {
	isPlaying = true
	moveCameraToGameView()
}

function moveCameraToGameView() {
	const targetPosition = { x: 0, y: 5, z: 15 }
	const duration = 100
	const initialPosition = {
		x: camera.position.x,
		y: camera.position.y,
		z: camera.position.z,
	}

	let elapsedTime = 0
	function animateCamera() {
		if (elapsedTime < duration) {
			elapsedTime += clock.getDelta() * 1000
			const t = Math.min(elapsedTime / duration, 1)

			camera.position.x = THREE.MathUtils.lerp(
				initialPosition.x,
				targetPosition.x,
				t
			)
			camera.position.y = THREE.MathUtils.lerp(
				initialPosition.y,
				targetPosition.y,
				t
			)
			camera.position.z = THREE.MathUtils.lerp(
				initialPosition.z,
				targetPosition.z,
				t
			)

			requestAnimationFrame(animateCamera)
		} else {
			camera.lookAt(0, 2, 0)
		}
	}

	animateCamera()
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
	scene.background = new THREE.Color(0x000022)

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	document.body.appendChild(renderer.domElement)

	controls = new OrbitControls(camera, renderer.domElement)
	controls.target.set(0, 2, 0)
	controls.update()

	const ambientLight = new THREE.AmbientLight(0x202020)
	scene.add(ambientLight)

	const moonLight = new THREE.DirectionalLight(0x809fff, 0.8)
	moonLight.position.set(-50, 100, -50)
	moonLight.castShadow = true
	moonLight.shadow.mapSize.width = 2048
	moonLight.shadow.mapSize.height = 2048
	moonLight.shadow.camera.near = 0.5
	moonLight.shadow.camera.far = 300
	scene.add(moonLight)

	const casetaLight1 = new THREE.PointLight(0xffffff, 1.5, 15)
	casetaLight1.position.set(0, 8, -5)
	casetaLight1.castShadow = true
	scene.add(casetaLight1)

	const casetaLight2 = new THREE.PointLight(0xffffff, 1.5, 15)
	casetaLight2.position.set(0, 8, -10)
	casetaLight2.castShadow = true
	scene.add(casetaLight2)

	const cornerLight1 = new THREE.PointLight(0xffffff, 1.2, 12)
	cornerLight1.position.set(-12, 5, -10) // Left-back corner
	cornerLight1.castShadow = true
	scene.add(cornerLight1)

	const cornerLight2 = new THREE.PointLight(0xffffff, 1.2, 12)
	cornerLight2.position.set(12, 5, -10) // Right-back corner
	cornerLight2.castShadow = true
	scene.add(cornerLight2)

	addDecorativeLights()

	window.addEventListener('resize', onWindowResize)
}

function addDecorativeLights() {
	const rgbColors = [0xff0000, 0x00ff00, 0x0000ff]
	const bulbSpacing = 2
	const bulbRadius = 0.2

	for (let x = -15; x <= 15; x += bulbSpacing) {
		addBulb(new THREE.Vector3(x, 10, 0), rgbColors)
	}

	for (let y = 2; y <= 10; y += bulbSpacing) {
		addBulb(new THREE.Vector3(-15, y, 0), rgbColors)
	}

	for (let y = 2; y <= 10; y += bulbSpacing) {
		addBulb(new THREE.Vector3(15, y, 0), rgbColors)
	}
}

function addBulb(position, rgbColors) {
	const color = rgbColors[Math.floor(Math.random() * rgbColors.length)]
	const bulbLight = new THREE.PointLight(color, 2, 10)
	bulbLight.position.copy(position)
	scene.add(bulbLight)

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

	createBoxWithPhysics(
		boothWidth,
		boothHeight,
		wallThickness,
		0,
		new THREE.Vector3(0, boothHeight / 2, -boothDepth),
		new THREE.Quaternion(0, 0, 0, 1),
		boothMaterial
	)

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
	const columns = 6
	const spacing = 3
	const startX = -(columns / 2) * spacing
	const startY = 3
	const repisaHeight = 0.5
	const repisaDepth = 1

	for (let i = 0; i < rows; i++) {
		const pos = new THREE.Vector3(-0.5, startY + i * 4 - repisaHeight / 2, -8)
		const quat = new THREE.Quaternion(0, 0, 0, 1)
		createBoxWithPhysics(
			columns * spacing + 10,
			repisaHeight,
			repisaDepth,
			0,
			pos,
			quat,
			repisaMaterial
		)
	}

	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < columns; j++) {
			const pos = new THREE.Vector3(startX + j * spacing, startY + i * 4, -8)
			const quat = new THREE.Quaternion(0, 0, 0, 1)
			const target = createBoxWithPhysics(1, 2, 1, 5, pos, quat, targetMaterial)
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
		if (!isPlaying) return

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
		pos.multiplyScalar(28)
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
