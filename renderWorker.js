import Cave from "./Cave/Cave.js";
import CaveHelper from "./Cave/CaveHelper.js";
import Screen from "./Cave/Screen.js";
import Attribute from "./GLTFViewer/Attribute.js";
import AttributeContainer from "./GLTFViewer/AttributesContainer.js";
import SceneDescriptor from "./GLTFViewer/SceneDescriptor.js";
import * as THREE from "./three/three.module.js";
import VRPNController from "./VRPNController.js";

import SceneInterface from './GLTFViewer/SceneInterface.js';
import SceneController from './GLTFViewer/SceneController.js';
import ClientManager from './GLTFViewer/ClientManager.js';
import CaveSceneController from "./GLTFViewer/CaveSceneController.js";


self.addEventListener("message", handleMessage )

function handleMessage ( message ) {
	// console.log(message);
	if(message.data.type === "monitorCanvas") {
		initRenderer(message.data.canvas);
	}
	if(message.data.type === "monitorCamera") {
		updateCamera(message.data.position, message.data.quaternion);
	}
	if(message.data.type === "caveCanvas") {
		console.log("caveCanvas")
		initCaveRenderer(message.data.canvas);
	}
	if(message.data.type === "caveCanvasResize") {
		console.log("caveCanvasResize")
		caveCanvasResize(message.data.width, message.data.height);
	}
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF);
const camera = new THREE.PerspectiveCamera( 50, 4/3, 0.01, 50 );


const trackedCamera = new THREE.PerspectiveCamera( 50, 1.5, 0.01, 0.3 );
const trackedCameraHelper = new THREE.CameraHelper(trackedCamera);
scene.add(trackedCameraHelper);

const pickingCamera = new THREE.PerspectiveCamera( 45, 1, 0.01, 30 );
scene.add(pickingCamera);


const PDS = Math.sqrt(2) * 1.8;
const t = new THREE.Vector3(1, 1, 0).normalize().multiplyScalar(2.25);
const screenCorners0 = [
    new THREE.Vector3(-PDS, 0, 0),
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(-PDS, 0, 2.25),
    new THREE.Vector3(0, PDS, 2.25),
];

const screenCorners1 = [
    new THREE.Vector3(0, PDS, 0),
    new THREE.Vector3(PDS, 0, 0),
    new THREE.Vector3( 0, PDS, 2.25),
    new THREE.Vector3( PDS, 0, 2.25),
];

const screenCorners2 = [
  new THREE.Vector3(-t.x, PDS - t.y, 0),
  new THREE.Vector3(PDS - t.x, -t.y, 0),
  new THREE.Vector3(0, PDS, 0),
  new THREE.Vector3(PDS, 0, 0),
];

const screens = [
    new Screen(screenCorners0),
    new Screen(screenCorners1),
    new Screen(screenCorners2),
]


// const testCorners = [
//     new THREE.Vector3(-PDS, 0, 0),
//     new THREE.Vector3(0, PDS, 0),
//     new THREE.Vector3(-PDS, 0, 2.25),
//     new THREE.Vector3(0, PDS, 2.25),
//     new THREE.Vector3(0, PDS, 0),
//     new THREE.Vector3(PDS, 0, 0),
//     new THREE.Vector3( 0, PDS, 2.25),
//     new THREE.Vector3( PDS, 0, 2.25),
//     new THREE.Vector3(-t.x, PDS - t.y, 0),
//     new THREE.Vector3(PDS - t.x, -t.y, 0),
//     new THREE.Vector3(0, PDS, 0),
//     new THREE.Vector3(PDS, 0, 0),
// ]

// const cornerSpheres = []
// for (let i = 0; i <12; ++i) {
//     cornerSpheres.push(new THREE.Mesh(
//         new THREE.SphereGeometry(0.025, 16, 16),
//         new THREE.MeshBasicMaterial({color: 0x660000})
//     ))
// } 
// const cornerSpheres0 = []
// for (let i = 0; i <12; ++i) {
//     cornerSpheres0.push(new THREE.Mesh(
//         new THREE.SphereGeometry(0.025, 16, 16),
//         new THREE.MeshBasicMaterial({color: 0x666600})
//     ))
// } 
// for (let i = 0; i <12; ++i) {
//     cornerSpheres[i].position.copy(testCorners[i])
//     cornerSpheres0[i].position.copy(testCorners[i])
//     scene.add(cornerSpheres[i])
//     scene.add(cornerSpheres0[i])
// } 


const worldAxes = new THREE.AxesHelper(10)
scene.add(worldAxes)

const cave = new Cave(screens);
const stereoCameras = cave.stereoScreenCameras;
const caveHelper = new CaveHelper(cave);
const caveHelper0 = new CaveHelper(cave);
scene.add(caveHelper)
// scene.add(caveHelper0)
caveHelper0.hideStereoScreenCameraHelpers()

const debugStereo = new THREE.Group()
scene.add(debugStereo);
debugStereo.position.set(0, -0.5, 0)
const leftDebug = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({color: 0xaa0000})
)
leftDebug.layers.set(1);
const rightDebug = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({color: 0x0000aa})
)
rightDebug.layers.set(2);
debugStereo.add(leftDebug, rightDebug)


const geometry = new THREE.BufferGeometry();
geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ) ] );
const laserPointer = new THREE.Line(geometry);
scene.add(laserPointer)


const leftHand = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0.2, 0xFF5500);
const rightHand = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0.2, 0x0055FF);
scene.add(leftHand)
scene.add(rightHand)
const pointer = new THREE.Mesh(
	new THREE.SphereGeometry(0.0125, 32, 32),
	new THREE.MeshBasicMaterial({color: 0xff0000})
)
scene.add(pointer)

let renderer = undefined;
let renderLeft = true;

const caveTransform = new THREE.Matrix4();
const caveRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
const caveTranslate = new THREE.Vector3(0, -1, 1.5);
// const caveTranslate = new THREE.Vector3(0, -1, -1);
const caveScale = new THREE.Vector3(1, 1, 1);
caveTransform.compose(caveTranslate, caveRotation, caveScale);
cave.transform = caveTransform;
caveHelper.position.copy(caveTranslate);
caveHelper.quaternion.copy(caveRotation);
caveHelper.scale.copy(caveScale);

// scene.add(caveHelper.stereoScreenCameraHelpers)

const leftEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshBasicMaterial({color: 0x660000})
    )
 const rightEye = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 16, 16),
        new THREE.MeshBasicMaterial({color: 0x660000})
    )   

    scene.add(leftEye, rightEye)

function initRenderer ( canvas ) {
	renderer = new THREE.WebGLRenderer({ canvas: canvas });

	renderer.setAnimationLoop( () => {
        // caveTransform.compose(caveTranslate, caveRotation, caveScale);

		trackedCamera.updateProjectionMatrix();
		trackedCamera.updateWorldMatrix();
        trackedCamera.matrixWorld.premultiply(caveTransform)
		trackedCameraHelper.update();
        // console.log(trackedCamera.matrixWorld)


		cave.updateStereoScreenCameras(trackedCamera.matrixWorld.clone(), caveTransform.clone());
		caveHelper.updateStereoScreenCameraHelpers();

        leftEye.position.copy(cave.stereoScreenCameras[0].leftEye)
        rightEye.position.copy(cave.stereoScreenCameras[0].rightEye)

        // for (let i = 0; i <12; ++i) {
        //     cornerSpheres[i].position.copy(testCorners[i])
        //     cornerSpheres[i].position.applyMatrix4(caveTransform)
        // } 

        // const corners0 = cave.stereoScreenCameras[0].corners;
        // const corners1 = cave.stereoScreenCameras[1].corners;
        // const corners2 = cave.stereoScreenCameras[2].corners;


        // cornerSpheres[0].position.copy(corners0[0])
        // cornerSpheres[1].position.copy(corners0[1])
        // cornerSpheres[2].position.copy(corners0[2])
        // cornerSpheres[3].position.copy(corners0[3])
        // cornerSpheres[4].position.copy(corners1[0])
        // cornerSpheres[5].position.copy(corners1[1])
        // cornerSpheres[6].position.copy(corners1[2])
        // cornerSpheres[7].position.copy(corners1[3])
        // cornerSpheres[8].position.copy(corners2[0])
        // cornerSpheres[9].position.copy(corners2[1])
        // cornerSpheres[10].position.copy(corners2[2])
        // cornerSpheres[11].position.copy(corners2[3])
        


		if(renderLeft) {
			camera.layers.enable(1);
			camera.layers.disable(2);
		}
		else {
			camera.layers.enable(2);
			camera.layers.disable(1);
		}
		renderLeft = !renderLeft;
		scene.background = new THREE.Color(0xaaaaaa);



		renderer.render(scene, camera);


	})
}

let caveRenderer = undefined;
let caveCanvas = undefined;
function initCaveRenderer ( canvas ) {
	caveCanvas = canvas;
	caveRenderer = new THREE.WebGLRenderer({ canvas: canvas });
	caveRenderer.setScissorTest(true);
	caveRenderer.setAnimationLoop( () => {
		
		caveHelper.visible = false;
		trackedCameraHelper.visible = false;
		scene.background = new THREE.Color(0X666666);
		const side = renderLeft ? "left" : "right";
		const viewWidth = canvas.width / 3;
		const viewHeight = canvas.height;
		for( let i = 0; i < 3; ++i ) {
			caveRenderer.setViewport(i * viewWidth, 0, viewWidth, viewHeight);
			caveRenderer.setScissor(i * viewWidth, 0, viewWidth, viewHeight);
			caveRenderer.render(scene, stereoCameras[i][side]);
		}

		caveHelper.visible = true;
		trackedCameraHelper.visible = true;

	})
}

const sceneInterface = new SceneInterface();
const sceneDescriptor = new SceneDescriptor();
const gltf = await sceneInterface.loadFile(`./GLTFViewer/glTF/ABeautifulGame.gltf`);
sceneDescriptor.loadGLTF(gltf.parser.json);

const sceneController = new CaveSceneController(sceneInterface, sceneDescriptor);
scene.add(sceneInterface.scene)
console.log(sceneInterface.scene)



const port = 8080;
const clientManager = new ClientManager();
clientManager.connect(port);


sceneController.clientManager = clientManager;
clientManager.sceneController = sceneController;




































const vrpnController = new VRPNController({
    hands: {
        left: {
            right: ( state ) => {
                console.log(`left hand left button ${state}`)
            },
            left: ( state ) => {
                console.log(`left hand left button ${state}`)
            },
            up: ( state ) => {
                console.log(`left hand up button ${state}`)
            },
            down: ( state ) => {
                console.log(`left hand down button ${state}`)
            },
            trigger: ( state ) => {
                console.log(`left hand trigger button ${state}`)
            },
            mode: ( state ) => {
                console.log(`left hand mode button ${state}`)
            },
            stick: ( direction ) => {
                console.log(`left hand stick ${direction[0]} ${direction[1]}`)
            },
            alt: ( state ) => { 
			
			},
            move: ( position, rotation ) => {
                leftHand.position.copy(position);
                leftHand.rotation.setFromQuaternion(rotation);
                // ray.origin.copy(position);
                // ray.direction.set(0,1,0).applyQuaternion(rotation);

                // laserPointer.position.copy(position)
                // laserPointer.rotation.setFromQuaternion(rotation)
            },
        },
        right: {
            right: ( state ) => {
                console.log(`right hand right button ${state}`)
            },
            left: ( state ) => {
                console.log(`right hand left button ${state}`)
            },
            up: ( state ) => {
                console.log(`right hand up button ${state}`)
            },
            down: ( state ) => {
                console.log(`right hand down button ${state}`)
            },
            trigger: ( state ) => {
                console.log(`right hand trigger button ${state}`)
            },
            mode: ( state ) => {
                console.log(`right hand mode button ${state}`)
            },
            stick: ( direction ) => {
                console.log(`right hand stick ${direction[0]} ${direction[1]}`)
            },
            alt: ( state ) => {
                console.log(`right hand alt button`)
			},
            move: ( position, rotation ) => {
                rightHand.position.copy(position);
                rightHand.rotation.setFromQuaternion(rotation);
            },
        },
    },
    head: {
        move: ( position, rotation ) => {
            trackedCamera.position.copy(position);
            trackedCamera.rotation.setFromQuaternion(rotation);
        },
    }
});









function updateCamera ( position, quaternion ) {
	camera.position.fromArray(position);
	camera.quaternion.fromArray(quaternion);
	camera.updateMatrixWorld();
}

function caveCanvasResize ( width, height ) {
	console.log(width, height);
	caveCanvas.width = width;
	caveCanvas.height = height;
}

function flipEyes ( ) {
	renderLeft = !renderLeft;
}

vrpnController.connect();