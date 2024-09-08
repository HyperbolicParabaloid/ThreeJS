import * as THREE from "three"
import { randInt } from "three/src/math/MathUtils.js";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// Making the PieChart class.
export class PieChart {
	// Constuctor.
	constructor(_values=[], _colors=[], _fidelity=100, _height=1, _radius=1) {
        // Setting up data.
		this.data = {
            hide: [], // "Hide" is a Map the indexes that need to be hidden, and their status of completion.
			total: 0,
			values: _values,
            angles: [],
			wedges: _values.length,
			colors: _colors,
		};
        this.setData();

		// Generating colors if undefined.
		if (this.data.colors.length === 0)
			this.generateColors();

		// Variables.
		this.fidelity = _fidelity;
		this.height = _height;
		this.radius = _radius;
		this.geomData = [];
        this.queue = [];
        this.updateStep = 0.01; // 1% Change per frame.


        //this.queue.length = this.data.wedges;
        //this.queue.fill(null, 0, this.data.wedges);
		//this.object = new THREE.Object3D();
		this.group = new THREE.Group();

		// Setting up meshes.
		this.generateMesh();
    }

    // Setting up the data for the class.
    setData() {
        // Totaling.
		var total = 0;
        var hide = new Map();
        var angles = new Map();
		for (let v = 0; v < this.data.values.length; v++) {
			total += this.data.values[v];
            hide.set(v, {current: 1, target: 1});
            angles.set(v, null);
        }

        // Avoiding issues if the values are small.
        if (total / this.data.values.length < 1) {
            var scaler = Math.pow(10, (Math.ceil(Math.abs(Math.log10(total / this.data.values.length))) + 1));
            this.data.values.forEach((v, i) =>{ this.data.values[i] = v * scaler; }); // return v * 100; 
            total *= scaler;
            console.log(this.data.values);
        }

		// Setting up data.
		this.data.hide = hide;
		this.data.total = total;
        this.data.angles = angles;
    }

    // Float
    stepChanges() {
        // Basically iterates over all the queued changes, and pops them off when completed.
        for (let q = 0; q < this.queue.length; q++) {
            let index = Number(this.queue[q]);
            var delta = this.data.hide.get(index).current - this.data.hide.get(index).target;
            if (Math.abs(delta) < this.updateStep) {    // Snapping it to finished postion.
                this.data.hide.set(index, {current: this.data.hide.get(index).target, target: this.data.hide.get(index).target});
                this.queue.splice(q, 1);
            } else {
                this.data.hide.set(index, {current: this.data.hide.get(index).current - Math.sign(delta) * this.updateStep, target: this.data.hide.get(index).target});
            }

            // Setting the value of the object.
            var value = this.data.hide.get(index).current;
            this.group.children[index].scale.set(value, value, value);
        }
                
        //if (this.queue.length > 0)
        //    console.log(`Doing ${this.queue}`);
    }

    // Hides a given index if it exists.
    hide(index) {
        if (index >= 0 && index < this.data.wedges) {
            if (!this.queue.find((value) => { return value === index; }))
                this.queue.push(index);
            this.data.hide.set(index, {current: this.data.hide.get(index).current, target: 0});
        }
    }

    // Undoes the Hide on a given index if it exists.
    show(index) {
        if (index >= 0 && index < this.data.wedges) {
            if (!this.queue.find((value) => { return value === index; }))
                this.queue.push(index);
            this.data.hide.set(index, {current: this.data.hide.get(index).current, target: 1});
        }
    }

    // Upates PieChart hiding status.
    update() {
        // Basically iterates over all the queued changes, and pops them off when completed.
        for (let q = 0; q < this.queue.length; q++) {
            let index = Number(this.queue[q]);
            var delta = this.data.hide.get(index).current - this.data.hide.get(index).target;
            if (Math.abs(delta) < this.updateStep) {    // Snapping it to finished postion.
                //this.data.angles.set(q, {startAngle: this.data.angles.get(q).startAngle, deltaAngle: 0, subDivisions: 0});
                this.data.hide.set(index, {current: this.data.hide.get(index).target, target: this.data.hide.get(index).target});
                this.queue.splice(q, 1);
            } else {
                //this.data.hide.set(index, {current: this.data.hide.get(index).current - Math.sign(delta) * this.updateStep, target: this.data.hide.get(index).target});
                this.data.values[index] *= 0.5;//(1 - this.updateStep)];

                //for (let w = 0; w < this.data.wedges; w++) {
                    //    this.data.angles.set(q, {startAngle: this.data.angles.get(q).startAngle, deltaAngle: 0, subDivisions: 0});
                    //}
            }
            
            // Setting the value of the object.
            this.setData();
            //var value = this.data.hide.get(index).current;
            //this.group.children[index].scale.set(value, value, value);
        }
                
        //if (this.queue.length > 0)
        //    console.log(`Doing ${this.queue}`);
    }

    // Squishing the grapg.
    squishGraph(index, delta) { // Delta goes from 0-1, with 0 being a complete removal of the graph element, and 1 being it's full normal size.       
        // We need info on the volume of data to the left and to the right of me as we currently stand.
        //
        // Consider index = 3.
        //              ||
        //              \/
        // [100, 3, 14, 25, 61, 11, 22, 30, 43, 10, 87] (length = 11)
        //
        // Then, the volume would be:
        // LeftVol + 3  + RightVol
        //  [0->2] +  [3]   + [4->10]
        //   117   +  25    +  264      = 406
        //  28.83% + 6.15%  +  65.03%   = 100%
        //
        // Reducing 25 by 1%, i.e. 25 * .99 = 24.75
        //  28.82% + 6.10%  + 65.03%    = 99.95%
        //
        // So we essentially have 0.25 (0.05% of 406) volume to distribute evenly to the left/right volumes pro-rata shares.
        //  total = [0->2]  +  [4->10]
        //           117    +    264    =   381
        //          30.71%  +   69.29%  =   100%
        // Therefore, we need to give 30.71% of 0.25, or 0.077 to go towards left volume, and 69.29% of of 0.25, or 0.173 to go towards right volume.
        //          0.077   +   0.173   =   0.25
        //
        // Now, we have:
        //   [0->2] +  [3]  + [4->10]
        //  117.077 + 24.75 +  264.173  = 406
        //
        // Only problem is it's stupid af and we literally just need to do the first part and get 0.25. Then we need to do this pro-rata share thing
        // for the individual volumes, not by side, and that will determine the new starting positions as well as new sizes and stuff. Lmao.
        
        
        console.log(this.data.angles.get(index));
        this.data.angles.set(index);


    }

	// Generate RGB.
	randomColor() {
		var r = randInt(25, 1002) % 256;
		var g = randInt(25, 1003) % 256;
		var b = randInt(25, 1004) % 256;
		var color = `rgb(${r},${g},${b})`;
		return new THREE.Color(color);
	}

	// Generating the colors.
	generateColors() {
		for (let c = 0; c < this.data.wedges; c++) {
			this.data.colors.push(this.randomColor());
		}
	}

	// Generating the wedge.
	generateWedge(startAngle, deltaAngle, subDivisions) {
		deltaAngle /= subDivisions;
		var pivot = new THREE.Vector3(0, this.height / 2, 0);
		var wedgeData = [];

		// Generating sub-wedges.
		for (let i = 0; i < subDivisions; i++) {
			// Top.
			wedgeData.push(
				// Top Right.
				Math.cos(startAngle + (i * deltaAngle)) * this.radius,
				pivot.y,
				Math.sin(startAngle + (i * deltaAngle)) * this.radius,
				
				// Pivot.
				pivot.x,
				pivot.y,
				pivot.z,

				// Top Left.
				Math.cos(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				pivot.y,
				Math.sin(startAngle + ((i + 1) * deltaAngle)) * this.radius,
			);

			// Bottom.
			wedgeData.push(
				// Bottom Left.
				Math.cos(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				-pivot.y,
				Math.sin(startAngle + ((i + 1) * deltaAngle)) * this.radius,

				// Pivot.
				pivot.x,
				-pivot.y,
				pivot.z,

				// Bottom Right.
				Math.cos(startAngle + (i * deltaAngle)) * this.radius,
				-pivot.y,
				Math.sin(startAngle + (i * deltaAngle)) * this.radius,
			);

			// Back.
			wedgeData.push(
				// Bottom Right.
				Math.cos(startAngle + (i * deltaAngle)) * this.radius,
				-pivot.y,
				Math.sin(startAngle + (i * deltaAngle)) * this.radius,
				// Top Right.
				Math.cos(startAngle + (i * deltaAngle)) * this.radius,
				pivot.y,
				Math.sin(startAngle + (i * deltaAngle)) * this.radius,
				// Bottom Left.
				Math.cos(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				-pivot.y,
				Math.sin(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				
				// Top Right.
				Math.cos(startAngle + (i * deltaAngle)) * this.radius,
				pivot.y,
				Math.sin(startAngle + (i * deltaAngle)) * this.radius,
				// Top Left.
				Math.cos(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				pivot.y,
				Math.sin(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				// Bottom Left.
				Math.cos(startAngle + ((i + 1) * deltaAngle)) * this.radius,
				-pivot.y,
				Math.sin(startAngle + ((i + 1) * deltaAngle)) * this.radius,

			);
		}
		return wedgeData;
	}

	// Generating the mesh.
	generateMesh() {
		var startAngle = 0;
		var endAngle = 2 * Math.PI;
		for (let w = 0; w < this.data.wedges; w++) {
			// Generating the individual wedge.
			var subDivisions = this.data.values[w] / this.data.total;
			var deltaAngle = endAngle * subDivisions;
            var actualSubDivisions = Math.floor((this.fidelity * subDivisions) + 1.5);
			var wedgeData = this.generateWedge(startAngle, deltaAngle, actualSubDivisions);
            
            // Setting angle data for later use.
            this.data.angles.set(w, {startAngle: startAngle, deltaAngle: deltaAngle, subDivisions: actualSubDivisions});
			startAngle += deltaAngle;
		
			// Setting geometry.
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(wedgeData, 3));
			const material = new THREE.MeshStandardMaterial({
				color: this.data.colors[w],
			});

			// Adding mesh and making it so the PieChart is smoother.
			const mesh = new THREE.Mesh(geometry, material);
			//mesh.geometry = BufferGeometryUtils.mergeVertices(geometry);
			mesh.geometry.computeVertexNormals();
			this.group.add(mesh);
		}
	}
}