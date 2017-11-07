L.AngleMarker = L.Marker.extend({
  _setPos: function (pos) {
    L.DomUtil.setPosition(this._icon, pos);
    if (this._shadow) {
      L.DomUtil.setPosition(this._shadow, pos);
    }
    if (this.options.iconAngle) {
      this._icon.style.WebkitTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.iconAngle + 'deg)';
      this._icon.style.MozTransform = this._icon.style.MozTransform + 'rotate(' + this.options.iconAngle + 'deg)';
      this._icon.style.MsTransform = this._icon.style.MsTransform + 'rotate(' + this.options.iconAngle + 'deg)';
      this._icon.style.OTransform = this._icon.style.OTransform + 'rotate(' + this.options.iconAngle + 'deg)';
      this._icon.style.Transform = this._icon.style.Transform + 'rotate(' + this.options.iconAngle + 'deg)';
    }
    if (this.options.iconOrigin) {
      this._icon.style.WebkitTransformOrigin = this.options.iconOrigin;
      this._icon.style.MozTransformOrigin = this.options.iconOrigin;
      this._icon.style.MsTransformOrigin = this.options.iconOrigin;
      this._icon.style.OTransformOrigin = this.options.iconOrigin;
      this._icon.style.TransformOrigin = this.options.iconOrigin;
    }
    this._icon.style.zIndex = pos.y;
    this._zIndex = pos.y + this.options.zIndexOffset;
    this._resetZIndex();
  }
});
L.angleMarker = function (latlng, options) {
  return new L.AngleMarker(latlng, options);
};