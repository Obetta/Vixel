// UI controls wiring and event handlers

window.VixelControls = (function () {
  function updateValueDisplay(id, value, decimals = 2) {
    const display = document.getElementById(id);
    if (display) {
      if (decimals === 0) {
        display.textContent = Math.round(value);
      } else {
        display.textContent = value.toFixed(decimals);
      }
      return true;
    }
    return false;
  }

  function setupControls(field, world, spin, orbit) {
    const osc = document.getElementById('osc');
    const trails = document.getElementById('trails');
    const trailThickness = document.getElementById('trailThickness');
    const showPlane = document.getElementById('showPlane');
    const showPlane2 = document.getElementById('showPlane2');
    const showAxes = document.getElementById('showAxes');
    const showTrails = document.getElementById('showTrails');
    const spinX = document.getElementById('spinX');
    const spinY = document.getElementById('spinY');
    const spinZ = document.getElementById('spinZ');
    const resetSpinBtn = document.getElementById('resetSpinBtn');

    // Oscillation control
    if (osc) {
      osc.addEventListener('input', () => {
        const val = Number(osc.value);
        updateValueDisplay('oscValue', val, 2);
        field.setOscillation(val);
      });
      const val = Number(osc.value);
      updateValueDisplay('oscValue', val, 2);
      field.setOscillation(val);
    }

    // Trail strength control
    if (trails) {
      trails.addEventListener('input', () => {
        const val = Number(trails.value);
        const display = document.getElementById('trailsValue');
        if (display) display.textContent = `${Math.round(val * 100)}%`;
        field.setTrailStrength(val);
      });
      const val = Number(trails.value);
      const display = document.getElementById('trailsValue');
      if (display) display.textContent = `${Math.round(val * 100)}%`;
      field.setTrailStrength(val);
    }

    // Trail thickness control
    if (trailThickness) {
      trailThickness.addEventListener('input', () => {
        const val = Number(trailThickness.value);
        updateValueDisplay('trailThicknessValue', val, 0);
        field.setTrailThickness(val);
      });
      const val = Number(trailThickness.value);
      updateValueDisplay('trailThicknessValue', val, 0);
      field.setTrailThickness(val);
    }

    // Plane visibility toggles
    if (showPlane) {
      showPlane.addEventListener('change', () => {
        const plane = world.getObjectByName('vixel-grid-plane');
        if (plane) plane.visible = showPlane.checked;
      });
      const plane = world.getObjectByName('vixel-grid-plane');
      if (plane) plane.visible = showPlane.checked;
    }

    if (showPlane2) {
      showPlane2.addEventListener('change', () => {
        const plane2 = world.getObjectByName('vixel-grid-plane-2');
        if (plane2) plane2.visible = showPlane2.checked;
      });
      const plane2 = world.getObjectByName('vixel-grid-plane-2');
      if (plane2) plane2.visible = showPlane2.checked;
    }

    // Axes visibility toggle
    if (showAxes) {
      showAxes.addEventListener('change', () => {
        const axes = world.getObjectByName('vixel-axes-helper');
        if (axes) axes.visible = showAxes.checked;
        const legend = document.querySelector('.axis-legend');
        if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
      });
      const axes = world.getObjectByName('vixel-axes-helper');
      if (axes) axes.visible = showAxes.checked;
      const legend = document.querySelector('.axis-legend');
      if (legend) legend.style.display = showAxes.checked ? 'flex' : 'none';
    }

    // Trails visibility toggle
    if (showTrails) {
      showTrails.addEventListener('change', () => field.setTrailsVisible(showTrails.checked));
      field.setTrailsVisible(showTrails.checked);
    }

    // Stats visibility toggle
    const showStats = document.getElementById('showStats');
    if (showStats) {
      showStats.addEventListener('change', () => {
        window.toggleStatsDisplay(showStats.checked);
      });
      // Initialize to checked state (show by default)
      showStats.checked = true;
      window.toggleStatsDisplay(true);
    }

    // Auto spin controls
    if (spinX) {
      spinX.addEventListener('input', () => {
        const val = Number(spinX.value);
        updateValueDisplay('spinXValue', val, 2);
        spin.x = val * 0.5;
      });
      const val = Number(spinX.value);
      updateValueDisplay('spinXValue', val, 2);
      spin.x = val * 0.5;
    }

    if (spinY) {
      spinY.addEventListener('input', () => {
        const val = Number(spinY.value);
        updateValueDisplay('spinYValue', val, 2);
        spin.y = val * 0.5;
      });
      const val = Number(spinY.value);
      updateValueDisplay('spinYValue', val, 2);
      spin.y = val * 0.5;
    }

    if (spinZ) {
      spinZ.addEventListener('input', () => {
        const val = Number(spinZ.value);
        updateValueDisplay('spinZValue', val, 2);
        spin.z = val * 0.5;
      });
      const val = Number(spinZ.value);
      updateValueDisplay('spinZValue', val, 2);
      spin.z = val * 0.5;
    }

    // Reset auto spin button
    if (resetSpinBtn) {
      resetSpinBtn.addEventListener('click', () => {
        if (spinX) {
          spinX.value = '0';
          spinX.dispatchEvent(new Event('input'));
        }
        if (spinY) {
          spinY.value = '0';
          spinY.dispatchEvent(new Event('input'));
        }
        if (spinZ) {
          spinZ.value = '0';
          spinZ.dispatchEvent(new Event('input'));
        }
      });
    }
  }

  function updateCameraPositionDisplay(camera) {
    if (camera) {
      const pos = camera.position;
      const posDisplay = document.getElementById('cameraPosition');
      if (posDisplay) {
        posDisplay.textContent = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`;
      }
    }
  }

  return {
    setupControls,
    updateValueDisplay,
    updateCameraPositionDisplay
  };
})();

