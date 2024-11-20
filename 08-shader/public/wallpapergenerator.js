import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'

const gui = new GUI()

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
	camera.position.set(0, 0, 5)

	renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
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
		u_speed: { value: 1.0 }, // Speed multiplier
		u_rotation: { value: 0.0 }, // Rotation of the shader
		u_repeat: { value: 1.0 }, // Number of pattern repetitions
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

	// GUI controls
	const folderColors = gui.addFolder('Colors')
	folderColors.addColor(uniforms.u_color1, 'value').name('Color 1')
	folderColors.addColor(uniforms.u_color2, 'value').name('Color 2')
	folderColors.open()

	gui
		.add(uniforms.u_mode, 'value', {
			Waves: 0,
			Contours: 1,
			Flow: 2,
			Fractals: 3,
		})
		.name('Mode')
	gui.add(uniforms.u_bend, 'value', 0.0, 10.0, 0.1).name('Bend Strength')
	gui.add(uniforms.u_speed, 'value', 0.1, 5.0, 0.1).name('Speed')
	gui.add(uniforms.u_rotation, 'value', 0.0, Math.PI * 2, 0.01).name('Rotation')
	gui.add(uniforms.u_repeat, 'value', 1.0, 10.0, 0.1).name('Repetitions')
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
			uniform float u_speed;
			uniform float u_rotation;
			uniform float u_repeat;

			// Function for fractal effect
			float fractalPattern(vec2 st, float time) {
					vec2 uv = st * 1.0; // Tile the pattern
					float scale = 1.0;
					float result = 0.0;

					for (int i = 0; i < 5; i++) { // Fractal depth
							uv = abs(uv - 0.5) * 2.0; // Create the Sierpinski-like effect
							result += (sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time)) / scale;
							scale *= 2.0;
							uv *= 2.0; // Increase detail
					}

					return result * 0.5 + 0.5; // Normalize to [0,1]
			}

			void main() {
					vec2 st = gl_FragCoord.xy / u_resolution.xy;
					st -= 0.5; // Center the coordinates
					st *= u_repeat; // Scale for pattern repetitions
					
					// Apply rotation
					float angle = u_rotation;
					float cosA = cos(angle);
					float sinA = sin(angle);
					st = mat2(cosA, -sinA, sinA, cosA) * st;

					st += 0.5; // Restore to 0-1 range

					// Base patterns
					float wave = sin((st.x * 10.0 + u_time * u_speed) * 1.0) * 0.4
										 + sin((st.x * 20.0 + u_time * u_speed * 0.75) * 0.5) * 0.3
										 + sin((st.x * 5.0 + u_time * u_speed * 1.5) * 0.25) * 0.3;
					wave = wave * 0.5 + 0.5; // Normalize to 0-1 range

					float contour = abs(sin(st.x * 10.0 + u_time * u_speed) * 0.5 + 0.5);
					
					// Add bending to Flow
					float flow = fract(
							st.x * 10.0 + st.y * 10.0 + sin(st.y * u_bend) + u_time * u_speed * 0.2
					);

					// Fractal pattern for the new mode
					float fractal = fractalPattern(st, u_time * u_speed);

					vec3 color = mix(u_color1, u_color2, wave); // Default to Waves

					if (u_mode == 1) {
							color = mix(u_color1, u_color2, contour); // Contour Effect
					} else if (u_mode == 2) {
							color = mix(u_color1, u_color2, flow); // Flowing Pattern with Bend
					} else if (u_mode == 3) {
							color = mix(u_color1, u_color2, fractal); // Fractal Pattern
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
	const canvas = renderer.domElement
	if (!canvas) {
		console.error('No canvas found to save the image.')
		return
	}

	try {
		renderer.render(scene, camera)
		const dataURL = canvas.toDataURL('image/png')
		const link = document.createElement('a')
		link.download = `wallpaper_${Date.now()}.png`
		link.href = dataURL
		link.click()
	} catch (error) {
		console.error('Error saving the image:', error)
	}
}
