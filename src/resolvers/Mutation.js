import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const password = await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password
            }
        })

        return {
            user,
            token: generateToken(user.id)
        }
    },
    async login(parent, args, { prisma }, info) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })

        if (!user) {
            throw new Error('Unable to login')
        }

        const isMatch = await bcrypt.compare(args.data.password, user.password)

        if (!isMatch) {
            throw new Error('Unable to login')
        }

        return {
            user,
            token: generateToken(user.id)
        }
    },
    async deleteUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        return prisma.mutation.deleteUser({
            where: {
                id: userId
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        if (typeof args.data.password === 'string') {
            args.data.password = await hashPassword(args.data.password)
        }

        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data: args.data
        }, info)
    },

    async createOrder(parent, args, { prisma, request }, info){
        const userId = getUserId(request)
        //total price, shippingFee, orderDate will be coming from the front end

        let opArgs = {}
        opArgs.data = {
            ...args.data
        }
        opArgs.data.createdBy = {
            connect:{
                id: userId
            }
        }
        opArgs.data.buyer = {
            connect:{
                id: args.data.buyer
            }
        }
        opArgs.data.products = {
            connect: args.data.products.map(id=>{
                return { id }
            })
        }   

        return prisma.mutation.createOrder(opArgs,info)

    },
    async deleteOrder(parent, args, { prisma, request }, info){
        const userId = getUserId(request)

        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType
        
        const exists = await prisma.exists.Order({
            id: args.id,
            createdBy: {
                id: userId
            }
        })
        if(!exists && accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to delete order")
        }
   

        return prisma.mutation.deleteOrder({
            where:{
                id: args.id
            }
        })
    },

    async updateOrder(parent, args, { prisma, request }, info){
        const userId = getUserId(request)

        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType
        
        const exists = await prisma.exists.Order({
            id: args.id,
            createdBy: {
                id: userId
            }
        })
        if(!exists && accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to delete order")
        }

        let opArgs ={}

        opArgs.data = {
            ...args.data
        }
        opArgs.data.products = {
            set: args.data.products.map(id=>{
                return { id }
            })
        }   

        console.log(JSON.stringify(opArgs, undefined, 3))
        return prisma.mutation.updateOrder({
            ...opArgs,
            where:{
                id: args.id
            }
        }, info)
    },

    async processOrder(parent, args, { prisma, request }, info){
        const userId = getUserId(request)

        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType

        if(accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to process order")
        }

        return prisma.mutation.updateOrder({
            data:{
                purchaseDate: args.purchaseDate,
                isPaid: true
            },
    
            where:{
                id: args.id
            }
        }, info)
    },

    async createProduct(parent, args, { prisma, request }, info){
        const userId = getUserId(request)

        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType

        if(accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to create product")
        }
        //create price lists
        let opArgsPrice = {}
        opArgsPrice.data = {
            ...args.data.price
        }
        
        let price = await prisma.mutation.createPrice(opArgsPrice, info)

        // create product
        let opArgsProduct = {}
        opArgsProduct.data = {
            ...args.data
        }
        opArgsProduct.data.price = {
            connect:{
                id: price.id
            }
        }

      
        return prisma.mutation.createProduct(opArgsProduct, info)
    },

    async deleteProduct(parent, args, {prisma, request}, info){
        const userId = getUserId(request)

        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType
        
        if(accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to create product")
        }

        return prisma.mutation.deleteProduct({
            where:{
                id: args.id
            }
        })
    }
}

export { Mutation as default }