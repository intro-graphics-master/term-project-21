import {tiny, defs} from './assignment-4-resources.js';
//import {OrbitControls}  from'./thr/OrbitControls.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget 
         } = tiny;


const { Square,Cube, Subdivision_Sphere, Transforms_Sandbox_Base,
 Windmill, Closed_Cone, Rounded_Closed_Cone, Capped_Cylinder, Rounded_Capped_Cylinder, 
 Torus , Surface_Of_Revolution, Cylindrical_Tube,Cone_Tip
 } = defs;


    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// (Can define Main_Scene's class here)
var i = 1;

//
function distance2Coords(coord_1,coord_2){
  /*
  if(coord_1[0][3]=0){
    coord_1[0][3]=1;
  };
  if(coord_1[1][3]=0){
    coord_1[1][3]=1;
  };
  if(coord_1[2][3]=0){
    coord_1[2][3]=1;
  };
*/


  var distances = Math.sqrt(Math.pow(coord_1[0][0]*coord_1[0][3]-coord_2[0][0]*coord_2[0][3],2)
  +Math.pow(coord_1[1][1]*coord_1[1][3]-coord_2[1][1]*coord_2[1][3],2)
  +Math.pow(coord_1[2][2]*coord_1[2][3]-coord_2[2][2]*coord_2[2][3],2));
  return distances;
};

function twoCoords_vector(coord_1,coord_2){
  var vectorPoint1to2 = [coord_2[0][0]-coord_1[0][0],coord_2[1][1]-coord_1[1][1],coord_2[2][2]-coord_1[2][2]];
  return vectorPoint1to2;

}

 function Arrays_sum(array1, array2) 
{
  var result = [array1[0]+array2[0],array1[1]+array2[1],array1[2]+array2[2],array1[3]+array2[3]];
  return result;
};
export class Shape_From_File extends Shape
{                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                    // all its arrays' data from an .obj 3D model file.
  constructor( filename )
    { super( "position", "normal", "texture_coord" );
                                    // Begin downloading the mesh. Once that completes, return
                                    // control to our parse_into_mesh function.
      this.load_file( filename );
    }
  load_file( filename )
      {                             // Request the external file and wait for it to load.
                                    // Failure mode:  Loads an empty shape.
        return fetch( filename )
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( obj_file_contents => this.parse_into_mesh( obj_file_contents ) )
          .catch( error => { this.copy_onto_graphics_card( this.gl ); } )
      }
  parse_into_mesh( data )
    {                           // Adapted from the "webgl-obj-loader.js" library found online:
      var verts = [], vertNormals = [], textures = [], unpacked = {};   

      unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
      unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

      var lines = data.split('\n');

      var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
      var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split(WHITESPACE_RE);
        elements.shift();

        if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
        else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
        else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
        else if (FACE_RE.test(line)) {
          var quad = false;
          for (var j = 0, eleLen = elements.length; j < eleLen; j++)
          {
              if(j === 3 && !quad) {  j = 2;  quad = true;  }
              if(elements[j] in unpacked.hashindices) 
                  unpacked.indices.push(unpacked.hashindices[elements[j]]);
              else
              {
                  var vertex = elements[ j ].split( '/' );

                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);   
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                  
                  if (textures.length) 
                    {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                        unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }
                  
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);
                  
                  unpacked.hashindices[elements[j]] = unpacked.index;
                  unpacked.indices.push(unpacked.index);
                  unpacked.index += 1;
              }
              if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
          }
        }
      }
      {
      const { verts, norms, textures } = unpacked;
        for( var j = 0; j < verts.length/3; j++ )
        { 
          this.arrays.position     .push( Vec.of( verts[ 3*j ], verts[ 3*j + 1 ], verts[ 3*j + 2 ] ) );        
          this.arrays.normal       .push( Vec.of( norms[ 3*j ], norms[ 3*j + 1 ], norms[ 3*j + 2 ] ) );
          this.arrays.texture_coord.push( Vec.of( textures[ 2*j ], textures[ 2*j + 1 ]  ));
        }
        this.indices = unpacked.indices;
      }
      this.normalize_positions( false );
      this.ready = true;
    }
  draw( context, program_state, model_transform, material )
    {               // draw(): Same as always for shapes, but cancel all 
                    // attempts to draw the shape before it loads:
      if( this.ready )
        super.draw( context, program_state, model_transform, material );
    }
}

// export class Text_Line extends Shape                
// {                           // **Text_Line** embeds text in the 3D world, using a crude texture 
//                             // method.  This Shape is made of a horizontal arrangement of quads.
//                             // Each is textured over with images of ASCII characters, spelling 
//                             // out a string.  Usage:  Instantiate the Shape with the desired
//                             // character line width.  Then assign it a single-line string by calling
//                             // set_string("your string") on it. Draw the shape on a material
//                             // with full ambient weight, and text.png assigned as its texture 
//                             // file.  For multi-line strings, repeat this process and draw with
//                             // a different matrix.
//   constructor( max_size )                           
//     { super( "position", "normal", "texture_coord" );
//       this.max_size = max_size;
//       var object_transform = Mat4.identity();
//       for( var i = 0; i < max_size; i++ )
//       {                                       // Each quad is a separate Square instance:
//         defs.Square.insert_transformed_copy_into( this, [], object_transform );
//         object_transform.post_multiply( Mat4.translation([ 1.5,0,0 ]) );
//       }
//     }
//   set_string( line, context )
//     {           // set_string():  Call this to overwrite the texture coordinates buffer with new 
//                 // values per quad, which enclose each of the string's characters.
//       this.arrays.texture_coord = [];
//       for( var i = 0; i < this.max_size; i++ )
//         {
//           var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
//               col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

//           var skip = 3, size = 32, sizefloor = size - skip;
//           var dim = size * 16,  
//               left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
//               right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

//           this.arrays.texture_coord.push( ...Vec.cast( [ left,  1-bottom], [ right, 1-bottom ],
//                                                        [ left,  1-top   ], [ right, 1-top    ] ) );
//         }
//       if( !this.existing )
//         { this.copy_onto_graphics_card( context );
//           this.existing = true;
//         }
//       else
//         this.copy_onto_graphics_card( context, ["texture_coord"], false );

//     }
// }


const Main_Scene =
class Car_Control extends Scene
{                                             // **Solar_System**:  Your Assingment's Scene.
  constructor()
    {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
      super();
                                                        // At the beginning of our program, load one of each of these shape 
                                                        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape.
                                                        // Don't define blueprints for shapes in display() every frame.
               //[0,4,3.8], [.5,0,1], [.5,0,.8], [.4,0,.7], [.4,0,.5], [.5,0,.4], [.5,0,-1], [.4,0,-1.5], [.25,0,-1.8], [0,0,-1.7] 
      //const points = Vec.cast([],[],[],[],[],[]
          //             );

                                                // TODO (#1):  Complete this list with any additional shapes you need.
      this.shapes = { 'box' : new Cube(),
                   'ball_4' : new Subdivision_Sphere( 4 ),

                     'star' : new Planar_Star(), 
                 'sphere1'  : new Subdivision_Sphere(1),
                 'cylinder' : new Capped_Cylinder(4,20),
                 'test' : new Windmill(3),
                  'square' : new Square(),
                  'square1' : new Square(),
                     'donut' : new Torus(100, 100),

                 'tri' : new defs.Regular_2D_Polygon( 1, 3 ),
                     'cakelayer': new Capped_Cylinder(4,20),
                     'candlefire': new Closed_Cone(4,10),
                 //    'bullet': new defs.Surface_Of_Revolution( 9, 9, points ),
                     'houseup' : new defs.Cone_Tip (4, 4,  [[0,1],[0,1]] ),
                       'housewall' : new defs.Cylindrical_Tube  ( 1, 4,  [[0,2],[0,1]] ),


                     'teapot': new Shape_From_File( "assets/dpv.obj" ),
                       'bed': new Shape_From_File( "assets/BED.obj" ),

                     'TV':  new Shape_From_File( "assets/monitor.obj" ),
                    'Tund':  new Shape_From_File( "assets/TVtable.obj" ),
                    'Pillow':  new Shape_From_File( "assets/pillow.obj" )
                     //'text': new Text_Line(35)
                      };




//


      //this.shapes = { bullet: new defs.Surface_Of_Revolution( 9, 9, points ) };

      //const phong    = new defs.Phong_Shader( 1 );
      //this.solid     = new Material( phong, { diffusivity: .5, smoothness: 800, color: Color.of( .7,.8,.6,1 ) } );
    
      //this.shapes.bullet.draw( context, program_state, model_transform.times( Mat4.translation([-10,0,0]) ), this.solid );

                                                        // TODO (#1d): Modify one sphere shape's existing texture 
                                                        // coordinates in place.  Multiply them all by 5.
      // this.shapes.ball_repeat.arrays.texture_coord.forEach( coord => coord
       this.shapes.square1.arrays.texture_coord.forEach( coord => coord.scale(3));
     this.shapes.ball_4.arrays.texture_coord.forEach( coord => coord.scale(5));
     this.shapes.Pillow.arrays.texture_coord.forEach( coord => coord.scale(5));
      const phong    = new defs.Phong_Shader( 1 );
      this.solid     = new Material( phong, { diffusivity: .5, smoothness: 800, color: Color.of(1,1,1,1) } );// .7,.8,.6,1 
                                                              // *** Shaders ***

                                                              // NOTE: The 2 in each shader argument refers to the max
                                                              // number of lights, which must be known at compile time.
                                                              
      const phong_shader      = new defs.Phong_Shader  (2);
                                                              // Adding textures to the previous shader:
      const texture_shader    = new defs.Textured_Phong(2);
                                                              // Same thing, but with a trick to make the textures 
                                                              // seemingly interact with the lights:
      const texture_shader_2  = new defs.Fake_Bump_Map (2);
                                                              // A Simple Gouraud Shader that you will implement:
      const gouraud_shader    = new Gouraud_Shader     (2);
                                                              // Extra credit shaders:
      const black_hole_shader = new Black_Hole_Shader();
      const sun_shader        = new Sun_Shader();
      
       

                                              // *** Materials: *** wrap a dictionary of "options" for a shader.
        const phong2   = new defs.Phong_Shader();
      const texture = new defs.Textured_Phong( 1 );
      this.grey       = new Material( phong2, { color: Color.of( .5,.5,.5,1 ), ambient: 0, 
                                        diffusivity: .3, specularity: .5, smoothness: 10 })

    //   this.text_image = new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
     //                                            texture: new Texture( "assets/text.png" ) });
                                              // TODO (#2):  Complete this list with any additional materials you need:

      this.materials = { plastic: new Material( phong_shader, 
                                    { ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 1,0.5,1,1 ) } ),
                         PLN1: new Material( phong_shader, 
                                    { ambient: 0, diffusivity: 1, specularity: 0, color: Color.of( 0.5,0.5,0.5,1 ) } ),
                   plastic_stars: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/stars.png" ),
                                      ambient: 0, diffusivity: 1, specularity: 0, color: Color.of( .4,.4,.4,1 ) } ),
                           metal: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                           PLN2: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 0.2,0.2,0.2,1 ) } ),
                     metal_earth: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/earth.gif" ),
                                      ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( .5,.5,.5,1 ) } ),
                                   //b.jpg
                      PLN4: new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/bricks.png","NEAREST" ),
                                      ambient: 0, diffusivity: 1, specularity: 1, smoothness:10 } ), 

                       HouU: new Material( texture_shader_2,    
                                    { ambient: 1, diffusivity: 0, specularity: 1,  color: Color.of(0.65,0.2,0.2,1) } ),
                        HouW: new Material( texture_shader_2,    
                                    {  texture: new Texture( "assets/bricks.png" ),
                                      ambient: 1, diffusivity: 0, specularity: 1,  color: Color.of(0.2,0.2,0.5,1) } ),
                        HouW1: new Material( texture_shader_2,    
                                    {  texture: new Texture( "assets/bricks1.png" ),
                                      ambient: 1, diffusivity: 0, specularity: 1,  color: Color.of(0.2,0.2,0.5,1) } ),
                      moon2:  new Material(  gouraud_shader,
                                   {ambient: 0, diffusivity: 1, specularity: 0.5, color: Color.of( 1,1,1,1 )}),

                      star: new Material(  texture_shader_2,
                                  {texture: new Texture( "assets/star_face.png" ) ,
                                    ambient:1,diffusivity: 0, specularity: 0} ),

                      black_hole: new Material( black_hole_shader ),

                             sun: new Material( phong_shader, { ambient: 1, color: Color.of( 0,0,0,1 ) } ),
                      arms: new Material(phong_shader, { ambient: 0.5, diffusivity: 0.5,smoothness: 800 , specularity: 0.5, color: Color.of( 1,1,1,1 ) }),
                      cake1: new Material(phong_shader, { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of( 1,0.6,0.9,1 ) }),
                      cake2: new Material(phong_shader, { ambient: 0.5, diffusivity: 1, specularity: 0, color: Color.of( 0.6,0.6,1,1 ) }),
                      eyes: new Material(phong_shader, { ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0.2,1 ) }),
                      fire: new Material( sun_shader, { ambient: 1, color: Color.of( 1,0,0,1 ) } ),
                      grass: new Material(texture_shader_2, { texture: new Texture( "assets/grass.jpg" ),
                            ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ),
              car_texture: new Material(texture_shader_2, { texture: new Texture( "assets/Tex_0020_1.png" ),
                  ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ),
              car_texture2: new Material(texture_shader_2, { texture: new Texture( "assets/wheel_2.png" ),
                ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ),
              car_texture3: new Material(texture_shader_2, { texture: new Texture( "assets/wheel_3.png" ),
                ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ),
              car_texture4: new Material(texture_shader_2, { texture: new Texture( "assets/wheel_4.png" ),
                 ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ),

              sky_texture: new Material(texture_shader_2, { texture: new Texture( "assets/night.jpg" ),
                          ambient: 1, diffusivity: 1, specularity: 0, color: Color.of( 0,0,0,1 ) } ) ,
               bed_texture: new Material(texture_shader_2, { texture: new Texture( "assets/wooden.jpg" ),
                        ambient: 0.5, diffusivity: 1, specularity: 0 } ),
                pillow_texture: new Material(texture_shader_2, { texture: new Texture( "assets/stars.png" ),
                        ambient:1, diffusivity: 1, specularity: 0 } ),
                 text_image : new Material( texture_shader_2, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/TV.gif" ) })   

                       };
/*
              car_bump: new Material( new defs.Fake_Bump_Map( 1 ), { color: Color.of( 0,0,0,1 ), 
          ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture( "assets/Tex_0020_6.png" ) });
          */

                                  // Some setup code that tracks whether the "lights are on" (the stars), and also
                                  // stores 30 random location matrices for drawing stars behind the solar system:
      this.lights_on = false;
      
      this.car_model = Mat4.identity().times(Mat4.scale([1,1,1,1])); //Mat4.identity();
      this.fakecarP = this.carP = this.car_model.times(Mat4.scale([5, 5, 5])).times(Mat4.translation([6,-1.5,0]));
      this.carP = this.car_model.times(Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 )).times(Mat4.scale([5, 5, 5])).times(Mat4.translation([6,-1.5,0])));
                                     
//
      //let carP = 
      
      this.star_matrices = [];
      for( let i=0; i<30; i++ )
        this.star_matrices.push( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 0,1,0 ) )
                         .times( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 1,0,0 ) ) )
                         .times( Mat4.translation([ 0,0,-150 ]) ) );
    }
  make_control_panel()
    {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                      // buttons with key bindings for affecting this scene, and live info readouts.

                                 // TODO (#5b): Add a button control.  Provide a callback that flips the boolean value of "this.lights_on".
        //this.key_triggered_button() 
       //this.key_triggered_button( "lights on/off", [ "l" ],()=> this.lights_on = !this.lights_on );
       //this.key_triggered_button( "car_forward", [ "l" ],()=> this.lights_on = !this.lights_on );
       this.key_triggered_button( "car_forward",     [ "i" ], () => this.carP = this.carP.times(Mat4.translation([0,0,-0.1])), undefined, () => this.carP = this.carP.times(Mat4.translation([0,0,0])) );
       this.key_triggered_button( "car_backward",     [ "k" ], () => this.carP = this.carP.times(Mat4.translation([0,0,0.1])), undefined, () => this.carP = this.carP.times(Mat4.translation([0,0,0])) );
       this.key_triggered_button( "car_leftturn",     [ "j" ], () => this.carP = this.carP.times(Mat4.rotation(0.1, Vec.of( 0,1,0 ))), undefined,
        () => this.carP = this.carP.times(Mat4.rotation(0, Vec.of( 0,1,0 ))));
        this.key_triggered_button( "car_rightturn",     [ "l" ], () => this.carP = this.carP.times(Mat4.rotation(-0.1, Vec.of( 0,1,0 ))), undefined,
        () => this.carP = this.carP.times(Mat4.rotation(0, Vec.of( 0,1,0 ))));
       //this.key_triggered_button( "car_forward",     [ "i" ], () => this.carP = this.carP.times(Mat4.translation([0,0,-0.1])), undefined, () => this.carP = this.carP.times(Mat4.translation([0,0,0])) );
        //carP = car_model.times(Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 )).times(Mat4.translation([300,-97,0]))).times(Mat4.scale([40, 40, 40]))

    }
  display( context, program_state )
    {                                                // display():  Called once per frame of animation.  For each shape that you want to
                                                     // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
                                                     // different matrix value to control where the shape appears.
     
                           // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
                           
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 

                                // Add a helper scene / child scene that allows viewing each moving body up close.
          this.children.push( this.camera_teleporter = new Camera_Teleporter() );
           
          
    
                    // Define the global camera and projection matrices, which are stored in program_state.  The camera
                    // matrix follows the usual format for transforms, but with opposite values (cameras exist as 
                    // inverted matrices).  The projection matrix follows an unusual format and determines how depth is 
                    // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
                    // orthographic() automatically generate valid matrices for one.  The input arguments of
                    // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.          

          program_state.set_camera( Mat4.look_at( Vec.of( 20,0,0 ), Vec.of( 0,0,0 ), Vec.of( 0,0,20 ) ) );

          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 1000 );
        }

                                                                      // Find how much time has passed in seconds; we can use
                                                                      // time as an input when calculating new transforms:
      const t = program_state.animation_time / 1000;

                                                  // Have to reset this for each frame:
      this.camera_teleporter.cameras = [];
      this.camera_teleporter.cameras.push( Mat4.look_at( Vec.of( 1,0,0 ), Vec.of( 0,1,0 ), Vec.of( 0,0,1 ) ) );


                                             // Variables that are in scope for you to use:
                                             // this.shapes: Your shapes, defined above.
                                             // this.materials: Your materials, defined above.
                                             // this.lights:  Assign an array of Light objects to this to light up your scene.
                                             // this.lights_on:  A boolean variable that changes when the user presses a button.
                                             // this.camera_teleporter: A child scene that helps you see your planets up close.
                                             //                         For this to work, you must push their inverted matrices
                                             //                         into the "this.camera_teleporter.cameras" array.
                                             // t:  Your program's time in seconds.
                                             // program_state:  Information the shader needs for drawing.  Pass to draw().
                                             // context:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().                                                       

      let model_transform = Mat4.identity();



      /**********************************
      Start coding down here!!!!
      **********************************/         

      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 ), canclecy = Color.of( .3,.7,0,1 );

                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      
                                                  // TODO (#3b):  Use the time-varying value of sun_size to create a scale matrix 
                                                  // for the sun. Also use it to create a color that turns redder as sun_size
                                                  // increases, and bluer as it decreases.
      const smoothly_varying_ratio = .5 + .5 * Math.sin( 2 * Math.PI * t/10 ),
            sun_size = 1 + 2 * smoothly_varying_ratio,
            sun = model_transform.times( Mat4.scale([sun_size,sun_size,sun_size]));//undefined,
          


      this.materials.fire.color = Color.of( 1,0,0,1 ) ;  
           // Assign our current sun color to the existing sun material.          

                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by 
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

                                                // TODO (#3c):  Replace with a point light located at the origin, with the sun's color
                                                // (created above).  For the third argument pass in the point light's size.  Use
                                                // 10 to the power of sun_size.

      //const t = this.t = program_state.animation_time/1000;
      //const angle = Math.sin( t );
      const light_position = Mat4.rotation( 360, [ 0,0,10 ] ).times( Vec.of( 1,1,1,0 ) );
      program_state.lights = [ new Light( light_position, Color.of( 1,1,1,1 ), 100000000 ) ];


       const angle = Math.PI / 18;
       let x = Math.sin(8*t);
  
       
       let temp = model_transform;
       console.log(model_transform[0]);
       temp[0] = Arrays_sum(model_transform[0],[1,0,0,0]);
       temp[1] = Arrays_sum(model_transform[1],[0,1,0,0]);
       //temp[0][0]
       model_transform=Mat4.identity();

       console.log(distance2Coords(temp,model_transform));
       console.log(model_transform);
       model_transform=Mat4.identity();
       this.shapes.box.draw( context, program_state, temp.times(Mat4.scale([1,1,1])), this.materials.sky_texture);
       

       
      
       




        model_transform = Mat4.identity();
        model_transform =model_transform .times(Mat4.scale([0.3,0.3,0.3,1]));
     //   this.shapes.box.draw(context, program_state, model_transform, this.solid.override(yellow) );
   // this.shapes.bullet.draw( context, program_state, model_transform, this.solid.override(yellow) );

 // this.shapes.houseup.draw( context, program_state, model_transform.times(Mat4.translation([0,0,48])).times(Mat4.scale([100,100,30])), this.materials.plastic.override(Color.of(0.65,0.2,0.2,1)));//.override(Color.of(1,0,0,1)) );
  
//  this.shapes.tri.draw( context, program_state, model_transform.times( Mat4.scale([ 60,60,60 ]) )
   //                                    .times( Mat4.rotation( 90, Vec.of( 1,0,0 ) ) ),
  //                           this.materials.plastic.override(Color.of(0.65,0.2,0.2,1)));
  this.shapes.box.draw( context, program_state, model_transform.times(Mat4.scale([1000,1000,1000])), this.materials.sky_texture);
//floor
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([ 0,0,-39.9  ])).times( Mat4.scale([ 60,60,40 ]) ),
                               this.materials.plastic.override(Color.of(0.6,0.6,0.6,1)));
//walls
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([0,59.9,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials.plastic.override(Color.of(1,0.5,0.5,1))); 
this.shapes.square1.draw( context, program_state, model_transform.times(Mat4.translation([0,60,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials. HouW1); 

this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([0,-59.9,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),//.translation([ 0,0,39.9  ])
                               this.materials.plastic.override(Color.of(1,1,0.4,1))); 
this.shapes.square1.draw( context, program_state, model_transform.times(Mat4.translation([0,-60,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials. HouW1);                                

this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([-59.9,0,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),//.translation([ 0,0,39.9  ])
                               this.materials.plastic.override(Color.of(0.2,1,0.4,1))); 
this.shapes.square1.draw( context, program_state, model_transform.times(Mat4.translation([-60,0,0])).times( Mat4.scale([ 60,60,40 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials. HouW);   


// this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([59.9,0,0])).times( Mat4.scale([ 60,60,40 ]) )
//                                        .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
//                                this.materials.plastic.override(Color.of(1,0.8,1,1))); 
//this.shapes.square1.draw( context, program_state, model_transform.times(Mat4.translation([60,0,0])).times( Mat4.scale([ 60,60,40 ]) )
//                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
//                               this.materials. HouW);   
//windows and door
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,0,35])).times( Mat4.scale([ 0,60,5 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1))); 

this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,30,25])).times( Mat4.scale([ 0,10,5 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1))); 

this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,-20,10])).times( Mat4.scale([ 0,40,20 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1)));
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,50,10])).times( Mat4.scale([ 0,10,20 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1)));
                                                                                             
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,20,-20])).times( Mat4.scale([ 0,40,20 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1)));                                
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,-50,-20])).times( Mat4.scale([ 0,10,20 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1))); 
this.shapes.square.draw( context, program_state, model_transform.times(Mat4.translation([60,-30,-5])).times( Mat4.scale([ 0,10,5 ]) )
                                       .times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.plastic.override(Color.of(0.7,0.5,1,1)));

//ceiling                                                              
this.shapes.square.draw( context, program_state,  model_transform.times(Mat4.translation([ 0,0,39.9  ])).times( Mat4.scale([ 60,60,40 ]) ),
                               this.materials.plastic.override(Color.of(0.5,1,1,1)));   



//grass

this.shapes.square.draw( context, program_state,  model_transform.times(Mat4.translation([ 0,0,-40  ]))
                                       .times( Mat4.rotation( Math.PI, Vec.of( 1,0,0 ) ) ).times( Mat4.scale([ 1000,1000,1 ]) ),
                               this.materials.grass);

//computer, key_board,mouse
this.shapes.TV.draw( context, program_state,  model_transform.times(Mat4.translation([ -35,-50,-17  ])).times( Mat4.scale([ 10,10,10]) )
          .times( Mat4.rotation( Math.PI, Vec.of( 0,0,1 ) ) ).times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials.metal.override(Color.of(0.2,0.2,0.2,1)));  


if(this.lights_on){

  this.shapes.square.draw( context, program_state,  model_transform.times(Mat4.translation([ -35,-49.5,-15.7  ])).times( Mat4.scale([ 11.5,15,6]) )
          .times( Mat4.rotation( Math.PI, Vec.of( 0,0,1 ) ) ).times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials.text_image);//}
}else{
  this.shapes.square.draw( context, program_state,  model_transform.times(Mat4.translation([ -35,-49.5,-15.7  ])).times( Mat4.scale([ 11.5,15,6]) )
          .times( Mat4.rotation( Math.PI, Vec.of( 0,0,1 ) ) ).times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials.metal);  
}

//  const t1 = program_state.animation_time/1000;
//  while(t1<100){

//door 

  let doorP=model_transform.times(Mat4.translation([60,-30,-25]));
const t1 = program_state.animation_time/1000;

let OPENDOOR = doorP.times(Mat4.translation([0,-10 ,0 ]))
                                       .times( Mat4.rotation( Math.PI, Vec.of( 0,0,1 ) ) );
//                                        .times(Mat4.translation([0,-10 ,0 ]))
//                                        .times( Mat4.scale([ 0.1,10,15 ]) );
if(t1<15 && t1>=0){
this.shapes.box.draw( context, program_state,OPENDOOR.times(Mat4.rotation(t/15*(Math.PI/2),[0,0,-1])).times(Mat4.translation([0,-10 ,0 ]))
                                       .times( Mat4.scale([ 0.1,10,15 ]) ),this.materials.plastic.override(Color.of(1,0,0,1)));
 }
else if(t1<=30 && t1>=15){
this.shapes.box.draw( context, program_state, OPENDOOR
                                       .times( Mat4.rotation((t)/15 * Math.PI/2, Vec.of( 0,0,1 ) ) )
                                       .times(Mat4.translation([0,10 ,0 ]))
                                       .times( Mat4.scale([ 0.1,10,15 ]) ),
                               this.materials.plastic.override(Color.of(1,0,0,1)));
 }
else{this.shapes.box.draw( context, program_state, doorP.times( Mat4.rotation( Math.PI, Vec.of( 0,1,0 ) ) ).times( Mat4.scale([ 0.1,10,15 ]) ),
                               this.materials.plastic.override(Color.of(1,0,0,1)));}

//const t1 = program_state.animation_time/1000;
  //    const funny_orbit = Mat4.rotation(  Math.PI/4*t1, Vec.of( Math.cos(t1), Math.sin(t1), .7*Math.cos(t1) ) );
     // this.shapes.box.draw( context, program_state,  model_transform, this.grey );
      

// program_state.lights = [ new Light( Vec.of( 3,2,1,0 ),   Color.of( 1,1,1,1 ),  1000000 ),
//                                new Light( Vec.of( 3,10,10,1 ), Color.of( 1,.7,.7,1 ), 100000 ) ];
//       if( !context.scratchpad.controls ) 
//         { program_state.set_camera( Mat4.look_at( ...Vec.cast( [ 0,0,4 ], [0,0,0], [0,1,0] ) ) );
//           program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 500 );
//         }
//      // const t1 = program_state.animation_time/1000;
//      // const funny_orbit = Mat4.rotation(  Math.PI/4*t1, Vec.of( Math.cos(t1), Math.sin(t1), .7*Math.cos(t1) ) );
//       this.shapes.box.draw( context, program_state,model_transform , this.grey );
      
      
//       let strings = [ "This is some text", "More text", "1234567890", "This is a line.\n\n\n"+"This is another line.", 
//                       Text_Line.toString(), Text_Line.toString() ];
      
//                         // Sample the "strings" array and draw them onto a cube.
//       for( let i = 0; i < 3; i++ )                    
//         for( let j = 0; j < 2; j++ )
//         {             // Find the matrix for a basis located along one of the cube's sides:
//           let cube_side = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
//                   .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
//                   .times( Mat4.translation([ -.9, .9, 1.01 ]) );

//           const multi_line_string = strings[ 2*i + j ].split('\n');
//                         // Draw a Text_String for every line in our string, up to 30 lines:
//           for( let line of multi_line_string.slice( 0,30 ) )
//           {             // Assign the string to Text_String, and then draw it.
//             this.shapes.text.set_string( line, context.context);
//             this.shapes.text.draw( context, program_state, model_transform.times( cube_side )
//                                                  .times( Mat4.scale([ .03,.03,.03 ])), this.text_image );
//                         // Move our basis down a line.
//             cube_side.post_multiply( Mat4.translation([ 0,-.06,0 ]) );
//           }
//         } 
                           
//Tund
this.shapes.Tund.draw( context, program_state, model_transform.times( Mat4.translation([ -10,-46,-35  ])).times( Mat4.scale([ 20,10,10]) )
          .times( Mat4.rotation( Math.PI, Vec.of( 0,0,1 ) ) ).times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),  
                             this.materials.metal.override(Color.of(0.2,0.2,0.2,1)));
 //bed   
this.shapes.bed.draw( context, program_state,  model_transform.times(Mat4.translation([ -29,40,-27.2  ])).times( Mat4.scale([ 30,30,30 ]) )
                                            .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ),
                               this.materials.bed_texture);  
//PILLOW
this.shapes.Pillow.draw( context, program_state,  model_transform.times(Mat4.translation([ -53,40,-22  ])).times( Mat4.scale([ 5,5,5 ]) )
                                            .times( Mat4.rotation( Math.PI/2, Vec.of( 1,0,0 ) ) ).times( Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ) ),
                               this.materials.pillow_texture);  


 

    

     //let car_model =model_transform .times(Mat4.scale([0.3,0.3,0.3,1])); //Mat4.identity();
     //car                               
//this.shapes.teapot.draw( context, program_state, 
      
      //let carP = car_model.times(Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 )).times(Mat4.translation([300,-97,0]))).times(Mat4.scale([40, 40, 40]));
      
      
      
      //,this.materials.car_texture); 
      //ball
      let flyball_model = Mat4.identity().times(Mat4.scale([1,1,1,1])); //Mat4.identity();
      let flyball = flyball_model.times(Mat4.scale([5, 5, 5])).times(Mat4.translation([6,3,-1.5]));
      //Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ))
      

      if(distance2Coords(this.carP.times(Mat4.rotation(-Math.PI/2, Vec.of( 1,0,0 ))),flyball)<75)
      {
        
        flyball=flyball.times(Mat4.translation([ 0,1,0 ]));
      }

      
      //
      this.shapes.ball_4.draw(context, program_state, flyball,this.materials.plastic_stars);
      console.log(this.carP,flyball);
    console.log(distance2Coords(this.carP.times(Mat4.rotation(-Math.PI/2, Vec.of( 1,0,0 ))),flyball));
    //draw car
     if(i<=3){                               
        this.shapes.teapot.draw( context, program_state, this.carP,this.materials.car_texture); 
        //i = i
     }

     if(7>=i&i>=4){                               
        this.shapes.teapot.draw( context, program_state, this.carP,this.materials.car_texture2); 
     
     }
     if(11>=i&i>=8){
       this.shapes.teapot.draw( context, program_state, this.carP,this.materials.car_texture3); 
     }
     if(i>=12){
       this.shapes.teapot.draw( context, program_state, this.carP,this.materials.car_texture4); 
     }
    if(i>=16){
      i = i - 16;
    }
    i++;
    
    // this.shapes.teapot.draw( context, program_state, model_transform,this.materials.plastic_stars);                        
       
     
      const modifier = this.lights_on ? { ambient: 0.7 } : { ambient: 0.0 };
 if (t < 100)
  {
    model_transform = model_transform.times(Mat4.scale([5, 5, 5])).times(Mat4.translation([0,-t/10,0]));
  }
  this.shapes.donut.draw(context, program_state, model_transform.times(Mat4.translation([0,0,-0.1])), this.materials.sun.override(Color.of(0.5, 0.5, 0.8, 1)));
  this.shapes.donut.draw(context, program_state, model_transform.times(Mat4.translation([0,0,0.2])), this.materials.sun.override(Color.of(0.5, 0.5, 0.8, 1)));     

  // body
     this.shapes.cylinder.draw(context, program_state, model_transform, this.materials.cake2);
     this.shapes.cylinder.draw(context, program_state, model_transform.times(Mat4.translation([0,0,0.8])).times(Mat4.scale([0.7, 0.7, 0.7])), this.materials.cake1);
    
    //arms
     this.shapes.box.draw(context, program_state, model_transform.times(Mat4.translation([1.1,0,0])).times(Mat4.scale([0.1, 0.1, 0.4])), this.materials.arms); 
     this.shapes.box.draw(context, program_state, model_transform.times(Mat4.translation([-1.1,0,0])).times(Mat4.scale([0.1, 0.1, 0.4])), this.materials.arms); 
                                                 
           //.times(Mat4.rotation(1*angle*x, Vec.of( 0,-1,0 )))                                     

  //legs
     this.shapes.box.draw(context, program_state, model_transform.times(Mat4.rotation(1*angle*x, Vec.of( -1,0,0 ))).times(Mat4.translation([.4,0,-0.9])).times(Mat4.scale([0.1, 0.1, 0.8])), this.materials.arms); 
     this.shapes.box.draw(context, program_state, model_transform.times(Mat4.rotation(1*angle*x, Vec.of( 1,0,0 ))).times(Mat4.translation([-.4,0,-0.9])).times(Mat4.scale([0.1, 0.1, 0.8])), this.materials.arms);      
                                                

    //eyes
     this.shapes.ball_4.draw(context, program_state, model_transform.times(Mat4.translation([0.2,-0.7,0.8])).times(Mat4.scale([0.1, 0.1, 0.1])), this.materials.eyes); 
     this.shapes.ball_4.draw(context, program_state, model_transform.times(Mat4.translation([-0.2,-0.7,0.8])).times(Mat4.scale([0.1, 0.1, 0.1])), this.materials.eyes); 

                            // new value based on our light switch.                         
      //const modifier = this.lights_on ? { ambient: 1 } : { ambient: 1 };
      



//candlefire      
      //model_transform = Mat4.identity();


for (let i = 0; i < 9; i++)
{
      
      let can1=model_transform.times(Mat4.scale([0.3,0.3,0.4])).times(Mat4.translation([0, 0, 3])).times(Mat4.rotation(30*i,Vec.of(0,0,1))).times( Mat4.translation([-1.5,0,0]));
      
    if (t < 30)
    {
      this.shapes.cakelayer.draw(context,program_state,
                                        can1.times( Mat4.scale([0.1, 0.1, 3-t/10 ]) ),
                                       this.materials.plastic.override(Color.of(i/10 + 0.2, i/10, i/10, 1))); 
      let can1f = can1.times( Mat4.translation([0,0,1.5-t/20]));
      this.shapes.ball_4.draw(context,program_state,
                                       can1f.times( Mat4.scale([0.2, 0.2, 0.2 ]) ),
                                      this.materials.fire); 
            
      this.shapes.candlefire.draw(context,program_state,
                                   can1f.times(Mat4.rotation(270,Vec.of(1,0,0))).times( Mat4.translation([0,0,0.24])).times( Mat4.scale([0.2, 0.2, 0.2 ])),//.times( Mat4.scale([0.1, 0.1, 3 ]) ),
                                   this.materials.fire.override(modifier)); 
    }
 

}




 //program_state.set_camera(Mat4.translation([0,0,10]));
                  
      // this.camera_teleporter.cameras.push( Mat4.inverse( 

    }
}

const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }


const Camera_Teleporter = defs.Camera_Teleporter =
class Camera_Teleporter extends Scene
{                               // **Camera_Teleporter** is a helper Scene meant to be added as a child to
                                // your own Scene.  It adds a panel of buttons.  Any matrices externally
                                // added to its "this.cameras" can be selected with these buttons. Upon
                                // selection, the program_state's camera matrix slowly (smoothly)
                                // linearly interpolates itself until it matches the selected matrix.
  constructor() 
    { super();
      this.cameras = [];
      this.selection = 0;
    }
  make_control_panel()
    {                                // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                     // buttons with key bindings for affecting this scene, and live info readouts.
      
      this.key_triggered_button(  "Enable",       [ "e" ], () => this.enabled = true  );
      this.key_triggered_button( "Disable", [ "Shift", "E" ], () => this.enabled = false );
      this.new_line();
      this.key_triggered_button( "Previous location", [ "g" ], this.decrease );
      this.key_triggered_button(              "Next", [ "h" ], this.increase );
      this.new_line();
      this.live_string( box => { box.textContent = "Selected camera location: " + this.selection } );
    }  
  increase() { this.selection = Math.min( this.selection + 1, Math.max( this.cameras.length-1, 0 ) ); }
  decrease() { this.selection = Math.max( this.selection - 1, 0 ); }   // Don't allow selection of negative indices.
  display( context, program_state )
  {
    const desired_camera = this.cameras[ this.selection ];
    if( !desired_camera || !this.enabled )
      return;
    const dt = program_state.animation_delta_time;
    program_state.set_camera( desired_camera.map( (x,i) => Vec.from( program_state.camera_inverse[i] ).mix( x, .01*dt ) ) );    
  }
}


const Planar_Star = defs.Planar_Star =
class Planar_Star extends Shape
{                                 // **Planar_Star** defines a 2D five-pointed star shape.  The star's inner 
                                  // radius is 4, and its outer radius is 7.  This means the complete star 
                                  // fits inside a 14 by 14 sqaure, and is centered at the origin.
  constructor()
    { super( "position", "normal", "texture_coord" );
                    
      this.arrays.position.push( Vec.of( 0,0,0 ) );
      for( let i = 0; i < 11; i++ )
        {
          const spin = Mat4.rotation( i * 2*Math.PI/10, Vec.of( 0,0,-1 ) );

          const radius = i%2 ? 4 : 7;
          const new_point = spin.times( Vec.of( 0,radius,0,1 ) ).to3();

          this.arrays.position.push( new_point );
          if( i > 0 )
            this.indices.push( 0, i, i+1 )
        }         
                 
      this.arrays.normal        = this.arrays.position.map( p => Vec.of( 0,0,-1 ) );

                                      // TODO (#5a):  Fill in some reasonable texture coordinates for the star:
      // this.arrays.texture_coord = this.arrays.position.map( p => 
    }
}

const Gouraud_Shader = defs.Gouraud_Shader =
class Gouraud_Shader extends defs.Phong_Shader
{ 
  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
                          // TODO (#6b2.1):  Copy the Phong_Shader class's implementation of this function, but
                          // change the two "varying" vec3s declared in it to just one vec4, called color.
                          // REMEMBER:
                          // **Varying variables** are passed on from the finished vertex shader to the fragment
                          // shader.  A different value of a "varying" is produced for every single vertex
                          // in your array.  Three vertices make each triangle, producing three distinct answers
                          // of what the varying's value should be.  Each triangle produces fragments (pixels), 
                          // and the per-fragment shader then runs.  Each fragment that looks up a varying 
                          // variable will pull its value from the weighted average of the varying's value
                          // from the three vertices of its triangle, weighted according to how close the 
                          // fragment is to each extreme corner point (vertex).

      return `

      ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { 
                                          // TODO (#6b2.2):  Copy the Phong_Shader class's implementation of this function,
                                          // but declare N and vertex_worldspace as vec3s local to function main,
                                          // since they are no longer scoped as varyings.  Then, copy over the
                                          // fragment shader code to the end of main() here.  Computing the Phong
                                          // color here instead of in the fragment shader is called Gouraud
                                          // Shading.  
                                          // Modify any lines that assign to gl_FragColor, to assign them to "color", 
                                          // the varying you made, instead.  You cannot assign to gl_FragColor from 
                                          // within the vertex shader (because it is a special variable for final
                                          // fragment shader color), but you can assign to varyings that will be 
                                          // sent as outputs to the fragment shader.

      return this.shared_glsl_code() + `
        void main()
          {
             
          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER ********* 
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.  

                               // TODO (#6b2.3):  Leave the main function almost blank, except assign gl_FragColor to
                               // just equal "color", the varying you made earlier.
      return this.shared_glsl_code() + `
        void main()
          {
                        
          } ` ;
    }
}


const Black_Hole_Shader = defs.Black_Hole_Shader =
class Black_Hole_Shader extends Shader         // Simple "procedural" texture shader, with texture coordinates but without an input image.
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
      { 
                  // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader 
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or 
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders 
                  // within this function, one data field at a time, to fully initialize the shader for a draw.

                  // TODO (#EC 1b):  Send the GPU the only matrix it will need for this shader:  The product of the projection, 
                  // camera, and model matrices.  The former two are found in program_state; the latter is directly 
                  // available here.  Finally, pass in the animation_time from program_state. You don't need to allow
                  // custom materials for this part so you don't need any values from the material object.
                  // For an example of how to send variables to the GPU, check out the simple shader "Funny_Shader".

        // context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform,       
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { 
                  // TODO (#EC 1c):  For both shaders, declare a varying vec2 to pass a texture coordinate between
                  // your shaders.  Also make sure both shaders have an animation_time input (a uniform).
      return `precision mediump float;
             
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
                          // TODO (#EC 1d,e):  Create the final "gl_Position" value of each vertex based on a displacement
                          // function.  Also pass your texture coordinate to the next shader.  As inputs,
                          // you have the current vertex's stored position and texture coord, animation time,
                          // and the final product of the projection, camera, and model matrices.
      return this.shared_glsl_code() + `

        void main()
        { 

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { 
                          // TODO (#EC 1f):  Using the input UV texture coordinates and animation time,
                          // calculate a color that makes moving waves as V increases.  Store
                          // the result in gl_FragColor.
      return this.shared_glsl_code() + `
        void main()
        { 

        }`;
    }
}


const Sun_Shader = defs.Sun_Shader =
class Sun_Shader extends Shader
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
    {
                      // TODO (#EC 2): Pass the same information to the shader as for EC part 1.  Additionally
                      // pass material.color to the shader.
        const [ P, C, M ] = [ program_state.projection_transform, program_state.camera_inverse, model_transform ],
                      PCM = P.times( C ).times( M );
        const t = program_state.animation_time / 1000;
       //const smoothly_varying_ratio = .5 + .5 * Math.sin( 2 * Math.PI * t/10 ),
             // sun_color = Color.of(1,0,0, 1);


        context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform, false, Mat.flatten_2D_to_1D( PCM.transposed() ) );
        context.uniform4fv (gpu_addresses.sun_color, Color.of(1,0.5,0, 1));
        context.uniform1f ( gpu_addresses.time, program_state.animation_time / 1000 );
        context.uniform1f ( gpu_addresses.pulseHeight, 0 );
        context.uniform1f ( gpu_addresses.displacementHeight, 0.65 );
        context.uniform1f ( gpu_addresses.turbulenceDetail, 0.63 );
        context.uniform1f ( gpu_addresses.fireSpeed, 0.5 );

    }
                                // TODO (#EC 2):  Complete the shaders, displacing the input sphere's vertices as
                                // a fireball effect and coloring fragments according to displacement.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying float noise;
              varying float disp;
              uniform float time;
              uniform vec4 sun_color;        
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `

       uniform mat4 projection_camera_model_transform;

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        attribute vec2 uv2;

        uniform float fireSpeed;
        uniform float pulseHeight;
        uniform float displacementHeight;
        uniform float turbulenceDetail;

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
          return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        // Klassisk Perlin noise 
        float cnoise(vec3 P) {
          vec3 Pi0 = floor(P); // indexing
          vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P); // Fractional part for interpolation
          vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;

          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);

          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);

          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);

          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;

          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);

          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }

        // Ashima code 
        float turbulence( vec3 p ) {
            float t = -0.5;
            for (float f = 1.0 ; f <= 10.0 ; f++ ){
                float power = pow( 2.0, f );
                t += abs( cnoise( vec3( power * p ) ) / power );
            }
            return t;
        }

        void main() {
            noise = -0.8 * turbulence( turbulenceDetail * normal + ( time * 1.0 ) );

            float b = pulseHeight * cnoise(
                0.05 * position + vec3( 1.0 * time )
            );
            float displacement = ( 0.0 - displacementHeight ) * noise + b;

            vec3 newPosition = position + normal * displacement;
            gl_Position = projection_camera_model_transform * vec4( newPosition, 1.0 );
            disp = displacement*20.0;

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main() 
        {
              vec3 color = vec3((1.0-disp), (0.1-disp*0.2)+0.1, (0.1-disp*0.1)+0.1*abs(sin(disp)));
               gl_FragColor = vec4( color.rgb, 1.0 );
               gl_FragColor *= sun_color;
        } ` ;
    }
}
