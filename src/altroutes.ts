import { Priority, PrismaClient } from "../generated/client.js";
import { Prisma } from "../generated/client.js";
import type { FastifyInstance, FastifyPluginCallback, RequestQuerystringDefault } from "fastify";
import { sendSlackMessage } from './services/slack.service.js';
import { PRIORITIES } from "./enums.js";

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
                    sendSlackMessage("error: GET/ route").catch(console.error);
                    return reply.status(500).send("Server error");
                }
        });

        //GET route "/random" returns a random to-do
        andrewsApp.get<{ Querystring: { iscomplete: string, priorityrequest: Priority } }>("/random/", {
            schema: {
                querystring:{
                    type: 'object', required: ['iscomplete'],
                    properties:{
                        iscomplete: {type: 'string'},
                        priorityrequest: { type: "string", enum: PRIORITIES }
                    }
                }
            }
        }, async (request, reply) => {
            //try/catch block
            try{
                const priorityData = request.query.priorityrequest;
                const filter = request.query.iscomplete === "true";
                //create an array of to-dos with prisma client
                const manyTodos = await prisma.todo.findMany(
                    //filter out elements in array based on whether the user wanted completed or incomplete elements, AND based on what priority requested
                    {where: { isDone: filter , priority : priorityData}}
                );
                //create a new array of the same to-dos with completed to-dos omitted
                //const sortedTodos = manyTodos.filter(item => !item.isDone);
                //are there any todos here still?
                if(manyTodos.length === 0){
                    //return a 404 error message if no todos are found
                    return reply.status(404).send("no to-dos found for request");
                }
                //generate a random index number within the length of the array 
                const randomNum : number = Math.floor(Math.random() * manyTodos.length);
                //use the index to find a random element and return it
                return manyTodos[randomNum];
            }
            catch (error) {
                console.log(error);
                sendSlackMessage("error: GET random route").catch(console.error);
                return reply.status(500).send("Server error");
            }            
        });
        
        //GET route "/:id" returns the to-do with the id number that is passed along
        andrewsApp.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const idNumber = Number(request.params.id);
            //error check: make sure id is a non-negative number
            if(isNaN(idNumber)){
                console.log("error: id must be a number")
                return reply.status(400).send("error: id is not a number");
            }
            else if(Number(idNumber) <= 0){
                console.log("error: id must be a number greater than zero")
                return reply.status(400).send("error: id must be a number greater than zero");
            }
            //try/catch block
            try{
                //Find unique to-do with prisma client
                const myTodo = await prisma.todo.findUnique({
                        where: {id: idNumber}
                });

                //Check to make sure a to-do was found
                if(!myTodo){
                    return reply.status(404).send("error: no to-dos found");
                }
                //return the to-do with the requested id number
                return myTodo;
            }
            catch(error){
                console.log(error);
                sendSlackMessage("error: GET id route").catch(console.error);
                return reply.status(500).send("Server error");
            }
        });

        //POST route "/" adds a new incomplete to-do to the list
        andrewsApp.post<{ Body: { title: string, priority: Priority, dueDate: string } }>("/", {
            schema: {
                body:{
                    type: 'object', required: ["title", "priority", "dueDate"],
                    properties:{
                        title: {type: 'string'},
                        priority: { type: "string", enum: PRIORITIES },
                        dueDate: {type: 'string'}
                    }
                }
            }
        },async (request, reply) => {
            //receive a string for title, a string for priority (must be either "High", "Medium", or "Low"), and a string for date
            
            //error check the data:            
            if(!request.body){
                return reply.status(400).send("error: request body is required");
            }
            // Title must exist and be a string
            const getTitle = request.body.title;
            const postTitle = getTitle.trim();
            if(!postTitle){
                console.log("error: to-do title must be a string containing characters");
                return reply.status(400).send("error: invalid title for to-do");
            }

            // priority must exist and match our schema: it must be one of either "High", "Medium", or "Low"
            const todoPriority = request.body.priority;
            //check priority string:
            if(todoPriority !== "High" && todoPriority !== "Medium" && todoPriority !== "Low"){                
                console.log("error: priority MUST be one of either 'Low', 'Medium', or 'High'");
                return reply.status(400).send("error: priority MUST be one of either 'Low', 'Medium', or 'High'");
            }
            // date must be valid JS date string
            const getDate = request.body.dueDate;
            const rawDate = getDate.trim();
            if (rawDate === '') {
                console.log("error: supplied date is not a properly configured");
                return reply.status(400).send("error, please supply a due date");
            }
            //check that the string is a valid date
            const todoDate = new Date(rawDate);
            if(isNaN(todoDate.getTime())){ 
                console.log("error: valid due date not detected, please ensure you have passed along a valid datestring for the due date");
                return reply.status(400).send("error: invalid datestring");
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
                console.log(error);
                sendSlackMessage("error: POST route").catch(console.error);
                return reply.status(500).send("Server error");
            }
        });

        //PATCH route "/:id/complete" marks a to do with id number as completed by setting isDone to true
        andrewsApp.patch<{ Params: { id: string } }>('/:id/complete', async (request, reply) => {
            //error check: make sure id is a non-negative number
            const idNumber = Number(request.params.id);
            if(isNaN(idNumber)){
                console.log("id must be a number")
                return reply.status(400).send("error: id must be a number");
            }
            else if(idNumber <= 0){
                console.log("id must be a non-negative number")
                return reply.status(400).send("error: id must be a number greater than zero");
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
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    // TypeScript now knows 'e' is a PrismaClientKnownRequestError
                    if (error.code === 'P2025') {
                    console.log('Record was not found');
                    return reply.status(404).send("No record found to update");
                    }
                }
                console.log(error);
                sendSlackMessage("error: PATCH route").catch(console.error);
                return reply.status(500).send("Server error");
            }
        });

        //DELETE route "/:id" deletes the to-do with the supplied id number
        andrewsApp.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
            const { id } = request.params;
            const idNumber = Number(id);
            //error check: make sure id is a non-negative number
            if(isNaN(idNumber)){
                console.log("id must be a number")
                return reply.status(400).send("error: id must be a number");
            }
            else if(idNumber <= 0){
                console.log("id must be a number greater than zero")
                return reply.status(400).send("id must be a number greater than zero");
            }
            //try/catch block
            try{
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
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                // TypeScript now knows 'error' is a PrismaClientKnownRequestError
                // Test for error code P2025: 
                if (error.code === 'P2025') {
                    console.log('Record was not found for deletion');
                    return reply.status(404).send("No record found to delete");
                    }
                }
                console.log(error);
                sendSlackMessage("error: DELETE route").catch(console.error);
                return reply.status(500).send("Server error");
            }
        });
        done();
    }
};