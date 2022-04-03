var TouchCameraMovement = pc.createScript('touchCameraMovement');

TouchCameraMovement.prototype.initialize = function() {
	this.XRot = 0;
	this.rayEnd = this.app.root.findByName('RaycastEndPoint');
};

TouchCameraMovement.prototype.postUpdate = function(dt) {
	var originEntity = this.entity.parent;

	var targetAng = new pc.Vec3(-20, this.XRot, 0);

	originEntity.setEulerAngles(targetAng);

	this.entity.setPosition(this.getWorldPoint());
	this.entity.lookAt(originEntity.getPosition());
};

TouchCameraMovement.prototype.getWorldPoint = function() {
	var from = this.entity.parent.getPosition();
	var to = this.rayEnd.getPosition();

	//var hitPoint = to;

	//var hit = this.app.systems.rigidbody.raycastFirst(from, to);

	//return hit ? hit.point : to;
	return to;
};
