import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

let scene, renderer
let camera
let camcontrols
let shaderMaterial, mesh
let uniforms

init()
animate()

function init() {
	// Scene setup
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
	camera.position.set(0, 0, 5) // Position the camera further away for rotation perspective

	renderer = new THREE.WebGLRenderer()
	renderer.setSize(window.innerWidth, window.innerHeight)
	document.body.appendChild(renderer.domElement)

	// Create uniforms with default values
	uniforms = {
		u_time: { value: 0.0 },
		u_resolution: {
			value: new THREE.Vector2(window.innerWidth, window.innerHeight),
		},
		u_color1: { value: new THREE.Color(0x1a1a1d) },
		u_color2: { value: new THREE.Color(0xc3073f) },
		u_mode: { value: 0 }, // Shader mode selector
		u_bend: { value: 0 }, // Bending strength for flow mode
	}

	// Shader Material
	shaderMaterial = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader(),
		fragmentShader: fragmentShader(),
	})

	// Full-screen quad
	const geometry = new THREE.PlaneGeometry(2, 2)
	mesh = new THREE.Mesh(geometry, shaderMaterial)
	scene.add(mesh)

	// Add a grid helper for rotation feedback
	const grid = new THREE.GridHelper(10, 10)
	scene.add(grid)

	// GUI controls
	const gui = new GUI()
	const folderColors = gui.addFolder('Colors')
	folderColors.addColor(uniforms.u_color1, 'value').name('Color 1')
	folderColors.addColor(uniforms.u_color2, 'value').name('Color 2')
	folderColors.open()

	gui
		.add(uniforms.u_mode, 'value', { Waves: 0, Contours: 1, Flow: 2 })
		.name('Mode')
	gui.add(uniforms.u_bend, 'value', 0.0, 10.0, 0.5).name('Bend Strength')
	gui.add({ saveImage }, 'saveImage').name('Save Image')

	// OrbitControls for rotation
	camcontrols = new OrbitControls(camera, renderer.domElement)

	// Handle window resize
	window.addEventListener('resize', onWindowResize)
}

// Vertex Shader
function vertexShader() {
	return `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `
}

// Fragment Shader
function fragmentShader() {
	return `
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform int u_mode;
        uniform float u_bend;

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;

            // Base patterns
            // Enhanced wave with multiple frequencies and phases for realism
            float wave = sin((st.x * 10.0 + u_time * 2.0) * 1.0) * 0.4
                       + sin((st.x * 20.0 + u_time * 1.5) * 0.5) * 0.3
                       + sin((st.x * 5.0 + u_time * 3.0) * 0.25) * 0.3;
            wave = wave * 0.5 + 0.5; // Normalize to 0-1 range

            float contour = abs(sin(st.x * 10.0 + u_time) * 0.5 + 0.5);
            
            // Add bending to Flow
            float flow = fract(
                st.x * 10.0 + st.y * 10.0 + sin(st.y * u_bend) + u_time * 0.2
            );

            vec3 color = mix(u_color1, u_color2, wave); // Default to Waves

            if (u_mode == 1) {
                color = mix(u_color1, u_color2, contour); // Contour Effect
            } else if (u_mode == 2) {
                color = mix(u_color1, u_color2, flow); // Flowing Pattern with Bend
            }

            gl_FragColor = vec4(color, 1.0);
        }
    `
}

function animate() {
	requestAnimationFrame(animate)

	// Update time uniform
	uniforms.u_time.value += 0.01

	renderer.render(scene, camera)
}

function onWindowResize() {
	renderer.setSize(window.innerWidth, window.innerHeight)
	uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
}

function saveImage() {
	const canvas = renderer.domElement // Get the WebGLRenderer's canvas
	if (!canvas) {
		console.error('No canvas found to save the image.')
		return
	}

	try {
		// Force a render to ensure the canvas has the latest frame
		renderer.render(scene, camera)

		// Convert the canvas content to a data URL (PNG format)
		const dataURL = canvas.toDataURL('image/png')

		// Create a download link and trigger a click event
		const link = document.createElement('a')
		link.download = `wallpaper_${Date.now()}.png` // Unique file name
		link.href = dataURL
		link.click()
	} catch (error) {
		console.error('Error saving the image:', error)
	}
}
