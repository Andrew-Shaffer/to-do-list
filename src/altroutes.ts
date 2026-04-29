import type { PrismaClient } from "../generated/client.js";
import { Priority } from "../generated/client.js";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import { sendSlackMessage } from './services/slack.service.js';

//open a connection using fastify and pass along prisma client
export function andrewsNewRoutes(prisma: PrismaClient): FastifyPluginCallback {
    return (andrewsApp: FastifyInstance, _opts, done) => {
        
        //GET route "/all" return a list of all to-dos
        andrewsApp.get("/", async (request, reply) => {
                // function carries risk, wrap in try/catch block
                try{
                    //Create an list of to-dos with prisma
                    const manyTodos = await prisma.todo.findMany();
                    //return the list
                    return manyTodos;
                }
                catch(error){
                    //Display potential errors
                    console.log(error);
                    return error;
                }
            });

        //GET route "/random" returns a random incomplete to-do
        andrewsApp.get("/random", async (request, reply) => {
            //try/catch block
            try{
                //create an array of to-dos with prisma client
                const manyTodos = await prisma.todo.findMany();
                //create a new array of the same to-dos with completed to-dos omitted
                const sortedTodos = manyTodos.filter(item => !item.isDone);
                //generate a random index number within the length of the array 
                const randomNum : number = Math.floor(Math.random() * sortedTodos.length);
                //use the index to find a random element and return it
                return sortedTodos[randomNum];
            }
            catch (error) {
                console.log(error);
                return error;
            }            
        });
        
        //GET route "/reminisce" returns a random already completed to-do
        //Same logic as before but this time with incomplete items omitted
        andrewsApp.get("/reminisce", async (request, reply) => {
            //try/catch block
            try{
                //create an array of to-dos with prisma client
                const manyTodos = await prisma.todo.findMany();
                //create a new array of the same to-dos with incomplete to-dos omitted
                const sortedTodos = manyTodos.filter(item => item.isDone);
                //generate a random index number within the length of the array 
                const randomNum : number = Math.floor(Math.random() * sortedTodos.length);
                //use the index to find a random element and return it
                return sortedTodos[randomNum];
            }
            catch (error) {
                console.log(error);
                return error;
            }            
        });

        //GET route "/:id" returns the to-do with the id number that is passed along
        andrewsApp.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const { id } = request.params;
            const idNumber = Number(id);
            //error check: make sure id is a non-negative number
            if(typeof idNumber !== 'number'){
                console.log("error: id must be a number")
                return;
            }
            else if(idNumber < 0){
                console.log("error: id must be a non-negative number")
                return;
            }
            //try/catch block
            try{
                //create an array of to-dos with prisma client
                const manyTodos = await prisma.todo.findMany();
                //return the to-do with the correct requested id number
                return manyTodos[idNumber];
            }
            catch(error){
                console.log(error);
                return error;
            }
        });

        //POST route "/" adds a new incomplete to-do to the list
        andrewsApp.post<{ Body: { title: string, priority: string, dueDate: Date } }>("/", async (request, reply) => {
            //receive a string for title, a string for priority (must be either "High", "Medium", or "Low"), and a string for date
            
            //error check the data:
            // Title must exist and be a string
            const postTitle = request.body.title;

            if(typeof postTitle !== 'string'){
                console.log("error: to-do title must be a string");
                return;
            }

            // priority must exist and match our schema: it must be one of either "High", "Medium", or "Low"
            const todoPriority = request.body.priority;

            //check priority string:
            if(todoPriority !== "High" && todoPriority !== "Medium" && todoPriority !== "Low"){                
                console.log("error: priority MUST be one of either 'Low', 'Medium', or 'High'");
                return;
            }
            //redundancy I think. I still added to help myself learn.
            const validPriority = Object.values(Priority).includes(todoPriority as Priority);            
            if(!validPriority){
                console.log("error, invalid priority");
                return;
            }

            // date must be valid JS date string
            const todoDate = request.body.dueDate as Date;
            if(false){
                console.log("error: valid due date not detected, please ensure you have passed along a valid datestring for the due date");
                return;
            }

            //try/catch block
            try{
                // use prisma to add a new element to the database with the selected strings as parameters, and isDone set to false
                const newTodo = await prisma.todo.create({
                    data: {
                    title: postTitle, 
                    priority : todoPriority,
                    dueDate : todoDate,
                    // Mark the new todo as not being complete, so isDone === false
                    isDone : false
                    },
                });             
                return newTodo;   
            }
            catch(error){
                sendSlackMessage("error: POST route").catch(console.error);
                console.log(error);
                return error;
            }
        });

        //PATCH route "/:id/complete" marks a to do with id number as completed by setting isDone to true
        andrewsApp.patch<{ Params: { id: string } }>('/:id/complete', async (request, reply) => {
            //error check: make sure id is a non-negative number
            const idNumber = Number(request.params.id);
            if(isNaN(idNumber)){
                console.log("id must be a number")
                return;
            }
            else if(idNumber < 0){
                console.log("id must be a non-negative number")
                return;
            }

            //try/catch block
            try{
                //use reference to the correct id number
                //change that array element so that isDone = true
                const newchange = await prisma.todo.update(
                {
                    where: { id: idNumber },
                    data: { isDone: true}
                });

                console.log("Data operation complete");
                return newchange;
            }
            catch(error){
                console.log(error);
                sendSlackMessage("error: PATCH route").catch(console.error);
                return error;
            }
        });

        //DELETE route "/:id" deletes the to-do with the supplied id number
        andrewsApp.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const { id } = request.params;
            const idNumber = Number(id);
            //error check: make sure id is a non-negative number
            if(isNaN(idNumber)){
                console.log("id must be a number")
                return;
            }
            else if(idNumber < 0){
                console.log("id must be a non-negative number")
                return;
            }
            //try/catch block
            try{
                //THERE IS A PROBLEM HERE (I THINK), we are using two different id, the array element and the id number prisma parameter......

                //use prisma to delete the array element with the error-checked id number
                const deletion = await prisma.todo.delete({
                    where: {
                        id: idNumber,
                    },
                });
                console.log("element deleted from array with id number: " + idNumber);
                return deletion;
            }
            catch(error){
                console.log(error);
                sendSlackMessage("error: DELETE route").catch(console.error);
                return error;
            }
        });
        done();
    }
};