# Engineering Phase 6 — Furniture Rendering Architecture

## Source and domain extension

Phase 5 `woodworking.open-box-cabinet@1.0.0` has dimensions but no shared placement. It remains unchanged for reproducibility. Version `1.1.0` adds a neutral geometry contract inside derivation: canonical XYZ size, centre placement, identity rotation, and stable instance keys. Shelf placement is explicitly defined as evenly distributed within clear height. Both renderers consume this snapshot geometry and never calculate cabinet construction dimensions.

## Coordinate system

`engineering-right-handed-mm`: origin is the cabinet left-bottom-front corner; X is width left-to-right, Y is height bottom-to-top, Z is depth front-to-back; unit is millimetres. Screen coordinates exist only inside view transforms.

## Rendering contracts

RenderingSource traces design ID, template ID/version, revision, snapshot bounds, dimensions, logical part keys, stable instance keys, XYZ sizes, positions and rotations. The adapter rejects snapshots without the v1 geometry contract rather than re-deriving them.

Projection2D provides `front`, `top`, and `side` primitives and source-valued dimension labels. SVG performs fit-to-view only; pixels never become domain dimensions.

SceneModel maps the same source parts to box objects and a camera hint. The 3D renderer is a dependency-free SVG axonometric view supporting azimuth and zoom transforms. It is not WebGL, photorealistic rendering, CAD, DXF, or a construction drawing.

## Compatibility, persistence, and failure

Template-runtime absence does not block a geometry-complete saved snapshot; it is marked snapshot-only. A legacy snapshot without shared placement stays readable as design data but visualisation reports unavailable. 2D and 3D errors are isolated. Views are ephemeral UI state, so Engineering DB remains v4 and no rendering store is added.
