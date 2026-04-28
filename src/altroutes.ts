import { application, Router } from "express";
import type { PrismaClient } from "../generated/client.js";
import { Priority } from "../generated/client.js";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";
import type { Id } from "@slack/web-api/dist/types/response/RtmStartResponse.js";

//open a connection using fastify and pass along prisma client
export function andrewsNewRoutes(prisma: PrismaClient): FastifyPluginCallback {
    return (andrewsApp: FastifyInstance, _opts, done) => {
        
        //GET route "/all" return a list of all to-dos
        andrewsApp.get("/all", async (request, reply) => {
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
                console.log("id must be a number")
                return;
            }
            else if(idNumber < 0){
                console.log("id must be a non-negative number")
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
            //receive a string for title, a string for priority (must be either "High", "Medium", or "Low"), and a string for date
            //error check the data:
            // Title must exist and be a string
            // priority must exist and match our schema: it must be one of either "High", "Medium", or "Low"
            // date must be valid JS date string

            //try/catch block
            // use prisma to add a new element to the database with the selected strings as parameters, and isDone set to false

        //PATCH route "/:id/complete" marks a to do with id number as completed by setting isDone to true
            //error check: make sure id is a non-negative number
            //try/catch block
            //create an array of to-dos with prisma client
            //find reference to the correct id number
            //change that array element so that isDone = true

        //DELETE route "/:id" deletes the to-do with the supplied id number
        andrewsApp.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const { id } = request.params;
            const idNumber = Number(id);
            //error check: make sure id is a non-negative number
            if(typeof idNumber !== 'number'){
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
                await prisma.todo.delete({
                    where: {
                        id: Number(idNumber),
                    },
                });
                console.log("element deleted from array with id number: " + idNumber);
            }
            catch(error){
                console.log(error);
                return error;
            }
        });
        done();
    }
};