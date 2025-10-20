import * as THREE from '../three/three.module.js';
import StereoCamera from './StereoScreenCamera.js';

export default class Cave {
	#screens;
	#stereoScreenCameras;
    #transform = new THREE.Matrix4();

	constructor ( screens ) {
		this.#screens = [ ...screens ];

		this.#stereoScreenCameras = [ ];
		for( const screen of screens ) {
			this.#stereoScreenCameras.push( new StereoCamera(screen) );
		}
	}

	get screens ( ) {
		return this.#screens;
	}

	get stereoScreenCameras ( ) {
		return this.#stereoScreenCameras;
	}

    set transform ( transform ) {
        console.log("transform cave")
        this.#transform.copy(transform);
        for( const stereoScreenCamera of this.#stereoScreenCameras ) {
			stereoScreenCamera.transform = transform;
		}
    }

	updateStereoScreenCameras ( headMatrix, transform ) {
		for( const stereoScreenCamera of this.#stereoScreenCameras ) {
			stereoScreenCamera.update(headMatrix, transform);
		}
	}
}