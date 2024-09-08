import { render } from "react-dom";
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "../static/style.css"
import { randInt } from "three/src/math/MathUtils.js";
//import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { PieChart } from "./PieChart.js";
import Stats from 'stats.js'

// Program.
var sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

var fidelity = {
  sphereResolution: 20,
}

// Creating the scene.
const scene = new THREE.Scene();

// Adding Mesh.
const geometry = new THREE.SphereGeometry(3, fidelity.sphereResolution, fidelity.sphereResolution);
const material = new THREE.MeshStandardMaterial({
  color: "#00ff83",
});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(-10, 0, 0);
//scene.add(mesh);

// Camera.
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 50, 50);
scene.add(camera)

// Ambient light.
//const ambientLight = new THREE.AmbientLight(0xffffff);
//scene.add(ambientLight);

// Adding sun 0.
const sunGeometry = new THREE.SphereGeometry(1, fidelity.sphereResolution, fidelity.sphereResolution);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: "white",
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
const sunLight = new THREE.PointLight(0xffffff, 100, 100);
sunMesh.add(sunLight);
sunMesh.position.set(0, 15, 0);
const sunPivot = new THREE.Object3D();
sunPivot.add(sunMesh);

// Adding sun 1.
const sunGeometry1 = new THREE.SphereGeometry(1, fidelity.sphereResolution, fidelity.sphereResolution);
const sunMaterial1 = new THREE.MeshBasicMaterial({
  color: "white",
});
const sunMesh1 = new THREE.Mesh(sunGeometry1, sunMaterial1);
const sunLight1 = new THREE.PointLight(0xffffff, 100, 100);
sunMesh1.add(sunLight1);
sunMesh1.position.set(0, -15, 0);
sunPivot.add(sunMesh1);
scene.add(sunPivot);

// Adding sun 2.
const sunGeometry2 = new THREE.SphereGeometry(1, fidelity.sphereResolution, fidelity.sphereResolution);
const sunMaterial2 = new THREE.MeshBasicMaterial({
  color: "white",
});
const sunMesh2 = new THREE.Mesh(sunGeometry1, sunMaterial1);
const sunLight2 = new THREE.PointLight(0xffffff, 100, 100);
sunMesh2.add(sunLight2);
sunMesh2.position.set(-15, 0, 0);
sunPivot.add(sunMesh2);
scene.add(sunPivot);

// Adding sun 3.
const sunGeometry3 = new THREE.SphereGeometry(1, fidelity.sphereResolution, fidelity.sphereResolution);
const sunMaterial3 = new THREE.MeshBasicMaterial({
  color: "white",
});
const sunMesh3 = new THREE.Mesh(sunGeometry1, sunMaterial1);
const sunLight3 = new THREE.PointLight(0xffffff, 100, 100);
sunMesh3.add(sunLight3);
sunMesh3.position.set(15, 0, 0);
sunPivot.add(sunMesh3);
scene.add(sunPivot);

// Renderer.
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer( {canvas} );
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(2);
renderer.render(scene, camera);

// Controls.
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
//controls.enablePan = false;
//controls.enableZoom = false;

// Adding PieChart.
const pieChart = new PieChart([0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.00000001, 0.0000001],//[100, 3, 14, 25, 61, 11, 22, 30, 43, 10, 87], 
														[],//[new THREE.Color(`rgb(256, 0, 0)`), new THREE.Color(`rgb(0, 256, 0)`), new THREE.Color(`rgb(0, 256, 256)`), new THREE.Color(`rgb(0, 0, 256)`)],
														20, 1, 5);
														//pieChart;	
//console.log(pieChart.group.children[0].removeFromParent());
scene.add(pieChart.group);
//pieChart.hide(2);
//pieChart.hide(2);
//pieChart.hide(1);
//pieChart.hide(4);
pieChart.hide(0);
console.log(pieChart.data.values);
//pieChart.update();

// Updating window.
window.addEventListener("resize", () => {
  // Updating sizes.
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera.
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

// Setting up time.
var lastUpdate = Date.now();
var dt = 0;
var done = false;

// FPS Stats.
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Updating canvas.
const loop = () => {
	// Capturing FPS data.
	stats.begin()

	// Timer.
	dt = Date.now() - lastUpdate;

	// "Unhiding" Mesh #4.
	if (dt > 4000 && !done) {
		done = true;
		//pieChart.show(4);
		pieChart.update();
		pieChart.group.clear();
		pieChart.generateMesh();
		console.log(pieChart.data.values);
	}

	// Updating PieChart.
	//pieChart.update();

	// Rotating light.
	sunPivot.rotateZ(0.01);
	sunPivot.rotateY(0.005);

  // Controls.
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);

	// Ending FPS capture.
	stats.end()
}
loop();