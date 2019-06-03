

## 
# Group #21

### **Non-obvious things implemented:**
The less moving part, the better the project car perform. You may not notice, the wheels moving effect actually are not a moving object, it is done by simply change the texture(of course a lot of photoshop). 
We creating some math method(functions) designed for Mat4 coordinate system, 

function distance2Coords
This function is able to measure the absolute distance between two coordinate system.
It is designed for Mat4. It is able to take the input as
The modeltransform.translation() is modifying the last column of the matrix in order to moving coordinate system in 3D space. This function is capable of multiply the translation factor and give correct distance result. 
This function only works for two coordinate systems that have the same scale.
By using this function, we are able to measure the distance between 2 object and create a collision effect.

function twoCoords_vector
This function is designed for finding the direction of two object’s collisions. By taking input of 2 coordinate system(when collision happens), it will return an 1 by 3 matrix to record the collision position from object 1 toward object 2. Thus we can use this position to make the object 2 moving towards collision direction.

function Arrays_sum
This function simply add up two vectors by adding each number in it.

function scaleVector
This function is really helpful for scale a vector and not changing anything else.



### **Difficulties:**

There were several difficulties, including making sure the matrix operations were in the right order so that it would do the correct operation we want each object to have in their movements such as rotating the door, the arms of the cake man etc. 

The camera view points was very hard to locate at first, the whole view became black after we tried to translate or rotate it.

We need to rotate every square and translate it to find it’s exact location , it’s hard to compute every single square’s location. And when we make the door rotate it’s hard to compute the angle with time change and also when rotate the cakeman when it wake up. 




### **Advanced topics used: **
By changing the texture of the car, we created a “fake” moving wheels effect and reduce the workload of the project.
Sun shader
By using our designed helper functions(distance2Coords,twoCoords_vector,function Arrays_sum,function scaleVector,etc), we are able to creating a simple collision system for the car and the ball. 



### **Teammates' contributions:**

Siyan Dong(Cathy):
draw candle with fire,  make the house, all the element in the house(door, tv , table, bed ) , and the  camera moving(looking cakeman in different viewpoint , first-person or third person perspective)

Yourong Yang(Young):
Drawing the sky(copy from van Gogh’s drawing), implementing the car object, modifying the car’s texture and creating wheels moving effect. Designed an collision system for the car and the ball. Creating all the helper function. 

Yingge Zhou(Jessica):
Drawing of the Cakeman, its movements(walking around, lifting arms, rolling out of bed, turning around), candle movements and some other trivial things.

Credit:
we get our car, bed, table, and monitor .obj file from free 3D website:
https://free3d.com/
