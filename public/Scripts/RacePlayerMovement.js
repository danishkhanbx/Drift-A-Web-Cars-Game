var TouchPlayerMovement = pc.createScript('touchPlayerMovement');

TouchPlayerMovement.attributes.add('sphereOffset', {
	type: 'vec3',
	default: new pc.Vec3(0, -0.75, 0)
});
TouchPlayerMovement.attributes.add('cameraOffset', {
	type: 'vec3',
	default: new pc.Vec3(0, 2, 4.43)
});
TouchPlayerMovement.attributes.add('accelaration', {
	type: 'number',
	default: 50
});
TouchPlayerMovement.attributes.add('steering', {
	type: 'number',
	default: 1
});
TouchPlayerMovement.attributes.add('turnSpeed', {
	type: 'number',
	default: 5
});
TouchPlayerMovement.attributes.add('turnStopLimit', {
	type: 'number',
	default: 0.75
});
TouchPlayerMovement.attributes.add('groundRayEnd', {
	type: 'vec3',
	default: new pc.Vec3(0, -1, 0)
});

TouchPlayerMovement.prototype.initialize = function() {
	var app = this.app;

	this.camera = app.root.findByName('Camera');

	this.leftBtn = app.root.findByName('leftBtn');
	this.rightBtn = app.root.findByName('rightBtn');
	this.upBtn = app.root.findByName('upBtn');
	this.downBtn = app.root.findByName('downBtn');

	this.turnLeft = 0;
	this.turnRight = 0;
	this.goForward = 0;
	this.goBackward = 0;

	this.speedInput = 0;
	this.rotateInput = 0;

	this.drifting = false;

	this.XRot = 0;

	this.driftTimeout = 100;
	if(isMobile) {
		this.leftBtn.button.on('touchstart', function(e) {
			this.turnLeft = 1;
		}.bind(this));
		this.leftBtn.button.on('touchend', function(e) {
			this.turnLeft = 0;
		}.bind(this));
		this.rightBtn.button.on('touchstart', function(e) {
			this.turnRight = 1;
		}.bind(this));
		this.rightBtn.button.on('touchend', function(e) {
			this.turnRight = 0;
		}.bind(this));

		this.upBtn.button.on('touchstart', function(e) {
			this.goForward = 1;
		}.bind(this));
		this.upBtn.button.on('touchend', function(e) {
			this.goForward = 0;
		}.bind(this));
		this.downBtn.button.on('touchstart', function(e) {
			this.goBackward = 1;
		}.bind(this));
		this.downBtn.button.on('touchend', function(e) {
			this.goBackward = 0;
		}.bind(this));
	}
	else {
		this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
		this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
	}
	this.canvas = this.app.graphicsDevice;

	this.cameraScript = this.camera.script.touchCameraMovement;

	this.player = app.root.findByName('Player');
	this.playerModel = app.root.findByName('PlayerModel');

	this.wheelLeft = this.playerModel.findByName('wheel_frontLeft');
	this.wheelRight = this.playerModel.findByName('wheel_frontRight');
};

TouchPlayerMovement.prototype.onKeyDown = function(event) {
	if (event.key === pc.KEY_W || event.key === pc.KEY_UP) {
		this.goForward = 1;
    }
    if (event.key === pc.KEY_A || event.key === pc.KEY_LEFT) {
		this.turnLeft = 1;
    }
    if (event.key === pc.KEY_S || event.key === pc.KEY_DOWN) {
		this.goBackward = 1;
    }
    if (event.key === pc.KEY_D || event.key === pc.KEY_RIGHT) {
		this.turnRight = 1;
    }
};

TouchPlayerMovement.prototype.onKeyUp = function(event) {
	if (event.key === pc.KEY_W || event.key === pc.KEY_UP) {
		this.goForward = 0;
    }
    if (event.key === pc.KEY_A || event.key === pc.KEY_LEFT) {
		this.turnLeft = 0;
    }
    if (event.key === pc.KEY_S || event.key === pc.KEY_DOWN) {
		this.goBackward = 0;
    }
    if (event.key === pc.KEY_D || event.key === pc.KEY_RIGHT) {
		this.turnRight = 0;
    }
};

TouchPlayerMovement.prototype.update = function(dt) {
	this.playerModel.setPosition(this.player.getPosition().add(this.sphereOffset));

	this.camera.setPosition(this.playerModel.getPosition().add(this.cameraOffset));

	this.speedInput = 0;
	this.speedInput += this.goForward / 2;
	this.speedInput -= this.goBackward / 2;
	this.speedInput *= this.accelaration;

	this.wheelLeft.setLocalEulerAngles(0, 180, 0);
	this.wheelRight.setLocalEulerAngles(0, 0, 0);

	if (this.speedInput > 0) {
		if (this.turnRight == 1 && this.rotateInput > -2.5) {
			this.rotateInput -= 0.1;
		}
		else if (this.turnLeft == 1 && this.rotateInput < 2.5) {
			this.rotateInput += 0.1;
		}
	}
	else if (this.speedInput < 0) {
		if (this.turnRight == 1 && this.rotateInput < 2.5) {
			this.rotateInput += 0.1;
		}
		if (this.turnLeft == 1 && this.rotateInput > -2.5) {
			this.rotateInput -= 0.1;
		}
	}
	else {
		this.rotateInput -= 0.1 * this.rotateInput;
	}
	if (this.turnRight == 0 && this.turnLeft == 0) {
		this.rotateInput -= 0.1 * this.rotateInput;
	}
	else if (this.turnRight == 1 && this.turnLeft == 1) {
		this.wheelLeft.setLocalEulerAngles(0, 180, 0);
		this.wheelRight.setLocalEulerAngles(0, 0, 0);
	}
	else if (this.turnRight == 1) {
		this.wheelLeft.setLocalEulerAngles(0, 160, 0);
		this.wheelRight.setLocalEulerAngles(0, -20, 0);
	}
	else if (this.turnLeft == 1) {
		this.wheelLeft.setLocalEulerAngles(0, 200, 0);
		this.wheelRight.setLocalEulerAngles(0, 20, 0);
	}

	this.XRot += this.rotateInput;

	this.drifting = false;
	if (Math.abs(this.XRot - this.cameraScript.XRot) > 25) {
		if (this.driftTimeout == 0) {
			this.drifting = true;
			this.drift(this.playerModel.getLocalPosition().clone().sub(this.playerModel.forward));
			this.driftTimeout = 5;
		}
	}
	if (this.driftTimeout > 0) this.driftTimeout--;

	this.cameraScript.XRot += (this.XRot - this.cameraScript.XRot) / 15;

	this.player.rigidbody.applyForce(this.playerModel.forward.scale(this.speedInput));

	var dampingForceX = -0.95 * this.entity.rigidbody.linearVelocity.x ^ dt;
	var dampingForceZ = -0.95 * this.entity.rigidbody.linearVelocity.z ^ dt;

	this.dampingForce = new pc.Vec3(dampingForceX, 0, dampingForceZ);

	this.entity.rigidbody.applyForce(this.dampingForce);

	smokes = this.app.root.findByTag('smoke');
	if(smokes.length > 0) {
		smokes.forEach(smoke => smoke.translate(0,0.05,0));
	}
/*
	var m = new pc.Mat4();
	var r = new pc.Quat();

	normal = this.fireRayCast(this.player.getPosition());
	if (normal != undefined) {
		normal.x = Math.round(normal.x * 10000) / 10000;
		normal.y = Math.round(normal.y * 10000) / 10000;
		normal.z = Math.round(normal.z * 10000) / 10000;
		setMat4Forward(m, normal, pc.Vec3.FORWARD)
		r.setFromMat4(m);
		this.playerModel.setRotation(r);
		this.playerModel.rotateLocal(-90, 0, 0);
	}
*/
	//this.playerModel.rotateLocal(0, this.XRot, 0);
	this.playerModel.rotateLocal(0, this.rotateInput, 0);

	statePosX = this.playerModel.getPosition().x;
	statePosY = this.playerModel.getPosition().y;
	statePosZ = this.playerModel.getPosition().z;
	stateRotX = this.playerModel.getEulerAngles().x;
	stateRotY = this.playerModel.getEulerAngles().y;
	stateRotZ = this.playerModel.getEulerAngles().z;
	stateLWheelRot = this.wheelLeft.getLocalEulerAngles().y;
	stateRWheelRot = this.wheelRight.getLocalEulerAngles().y;
	stateDrifting = this.drifting;

	socket.emit('changestate', {
		pos: {
			x: statePosX,
			y: statePosY,
			z: statePosZ
		},
		rot: {
			x: stateRotX,
			y: stateRotY,
			z: stateRotZ
		},
		wheelRot: {
			L: stateLWheelRot,
			R: stateRWheelRot
		},
		drifting: stateDrifting
	});
	//if(this.playerModel.oldState)
		//console.log(this.playerModel.oldState.statePosX == statePosX);
	/*
	if(this.playerModel.oldState && (
		this.playerModel.oldState.statePosX != statePosX ||
		this.playerModel.oldState.statePosY != statePosY ||
		this.playerModel.oldState.statePosZ != statePosZ ||
		this.playerModel.oldState.stateRotX != stateRotX ||
		this.playerModel.oldState.stateRotY != stateRotY ||
		this.playerModel.oldState.stateRotZ != stateRotZ ||
		this.playerModel.oldState.stateLWheelRot != stateLWheelRot ||
		this.playerModel.oldState.stateRWheelRot != stateRWheelRot ||
		this.playerModel.oldState.stateDrifting != stateDrifting
	)) {
	*/
	//console.log("sendstate");
	//}
	/*
	this.playerModel.oldState = {
		statePosX: statePosX,
		statePosY: statePosY,
		statePosZ: statePosZ,
		stateRotX: stateRotX,
		stateRotY: stateRotY,
		stateRotZ: stateRotZ,
		stateLWheelRot: stateLWheelRot,
		stateRWheelRot: stateRWheelRot,
		stateDrifting: stateDrifting
	};
	*/
};

TouchPlayerMovement.prototype.drift = function(pos) {
	var smoke1 = new pc.Entity("Smoke");
	smoke1.tags.add("smoke");
	smoke1.addComponent("model", {
		type: 'sphere',
		castShadows: false
	});
	rand = Math.random();
	smoke1.setLocalScale(
		0.25 * rand + 0.25,
		0.25 * rand + 0.25,
		0.25 * rand + 0.25
	);
	
	smoke1.setLocalPosition(
		pos.x + rand / 2,
		pos.y + rand / 3,
		pos.z + rand / 2
	);
	
	this.app.root.addChild(smoke1);
	setTimeout(function() { smoke1.destroy() }, 1500);
};

TouchPlayerMovement.prototype.fireRayCast = function(from) {
	var to = from.clone();
	to.y -= 2;

	var result = this.app.systems.rigidbody.raycastFirst(from, to);

	if (result) {
		return result.normal;
	}
	else {
		return new pc.Vec3(0, 1, 0);
	}
};

var setMat4Forward = (function() {
	var x, y, z;

	x = new pc.Vec3();
	y = new pc.Vec3();
	z = new pc.Vec3();

	return function(mat4, forward, up) {
		z.copy(forward).scale(-1);
		y.copy(up).normalize();
		x.cross(z, y).normalize();
		y.cross(z, x);

		var r = mat4.data;

		r[0] = x.x;
		r[1] = x.y;
		r[2] = x.z;
		r[3] = 0;
		r[4] = y.x;
		r[5] = y.y;
		r[6] = y.z;
		r[7] = 0;
		r[8] = z.x;
		r[9] = z.y;
		r[10] = z.z;
		r[11] = 0;
		r[15] = 1;

		return mat4;
	};
}());
