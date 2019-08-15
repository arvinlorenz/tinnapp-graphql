import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'
import { join } from 'path';

const accountTypes = {
    RETAILER: 'retail',
    RESELLER:   'reseller',
    CITY_DISTRIBUTOR: 'cityDistributor',
    PROVINCIAL_DISTRIBUTOR: 'provincialDistributor',
}

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
        console.log(user)

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
        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType

        return prisma.mutation.deleteUser({
            where: {
                id: args.id
            }
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        const user = await prisma.query.user(
            {
             where:{
                 id:userId
             }
            } 
         )
        const accountType = user.accountType
        if(!exists || accountType !== "PROVINCIAL_DISTRIBUTOR"){
            throw new Error("Not allowed to delete user")
        }
        if (args.id) {     
            const exists = await prisma.exists.User({
                id: args.id
            })
            if(!exists || accountType !== "PROVINCIAL_DISTRIBUTOR"){
                throw new Error("Not allowed to update user")
            }
            if (typeof args.data.password === 'string') {
                args.data.password = await hashPassword(args.data.password)
            }

            return prisma.mutation.updateUser({
                where: {
                    id: args.id
                },
                data: args.data
            }, info)
        } else {
            if (typeof args.data.password === 'string') {
                args.data.password = await hashPassword(args.data.password)
            }
    
            return prisma.mutation.updateUser({
                where: {
                    id: userId
                },
                data: args.data
            }, info)
        }    
    },

    async createOrder(parent, args, { prisma, request }, info){
        const userId = getUserId(request)
        let totalPrice = args.data.shippingFee || 0;
    
        let buyerAccountType = args.data.buyerAccount;

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
            create: args.data.products.map((p) => {
                
                totalPrice += p.quantity * p.price[buyerAccountType];
                prisma.mutation.updateProduct({
                    where: {
                        id: p.product
                    },
                    data: {
                        available: p.available - p.quantity
                    }
                });
                return {
                    quantity: p.quantity,
                    product: {
                        connect: {
                            id: p.product
                        }
                    }
                }
            })
        }
        opArgs.data.totalPrice = totalPrice;
        delete opArgs.data.buyerAccount;
       
       return prisma.mutation.createOrder(opArgs,info)

    },
    async deleteOrder(parent, args, { prisma, request }, info){
        const products = args.orderedProducts;
        for (let p of products) {
            try {
                await prisma.mutation.updateProduct({
                    where: {
                        id: p.product
                    },
                    data: {
                        available: p.available + p.quantity
                    }
                  })
            } catch (error) {
                continue;
            }
            
        }

          
        return await prisma.mutation.deleteOrder({
            where:{
                id: args.id
            }
        }, info);
    },
    //UPDATE ORDER STILL NEEDS TO BE FIXED
    async updateOrder(parent, args, { prisma, request }, info){
        const buyerAccount = args.data.buyerAccount
        let totalPrice = args.data.shippingFee;
        let withPriceArray = [];

        const updateProductCount = async (id, newAvailable) => {
            await prisma.mutation.updateProduct({
                where: {
                    id
                },
                data: {
                    available: newAvailable
                }
              })
        }

        const deleteOrderedProduct = async (id) => {
            await prisma.mutation.deleteOrderedProduct({
                where: {
                    id
                }
              })
        }

        // Scan Old products, if it is existing in new products it will update, else no change
        let updatedProducts = [];
        for (const oldP of args.data.oldProductData) {

            const inNewProduct = args.data.products.find(p => p.product === oldP.product)
            let newAvailable = oldP.available;

            if (inNewProduct){
                if (inNewProduct.quantity > oldP.quantity) {
                    newAvailable  = newAvailable - (inNewProduct.quantity - oldP.quantity)
                    await updateProductCount(oldP.product, newAvailable)
                    updatedProducts.push({ orderedProduct: oldP.orderedProduct, quantity: inNewProduct.quantity})
                    withPriceArray.push({quantity: inNewProduct.quantity, price: inNewProduct.price})
                } else if(inNewProduct.quantity < oldP.quantity) {
                    newAvailable = newAvailable + (oldP.quantity - inNewProduct.quantity)
                    await updateProductCount(oldP.product, newAvailable)
                    updatedProducts.push({ orderedProduct: oldP.orderedProduct, quantity: inNewProduct.quantity})
                    withPriceArray.push({quantity: inNewProduct.quantity, price: inNewProduct.price})


                } else if(inNewProduct.quantity === oldP.quantity){ //if did not change the value
                    updatedProducts.push({ orderedProduct: oldP.orderedProduct, quantity: inNewProduct.quantity})
                    withPriceArray.push({quantity: inNewProduct.quantity, price: inNewProduct.price})
                }
            }   
            else {
                newAvailable = newAvailable + oldP.quantity;
                // totalPrice -= oldP.price[buyerAccount] *  oldP.quantity;
                await updateProductCount(oldP.product, newAvailable)
                await deleteOrderedProduct(oldP.orderedProduct)
            }
        }

       // Scan ordered products, if it is not existing in old products it create new orderedProducts, else no change

       let newProducts = [];
       for (const p of args.data.products) {
           const existsInOld = args.data.oldProductData.some(oldP => p.product === oldP.product)
           if (!existsInOld) {
            let newAvailable = p.available - p.quantity;
            await updateProductCount(p.product, newAvailable)
            newProducts.push(p)
            withPriceArray.push({quantity: p.quantity, price: p.price})

           }
       }

       totalPrice += withPriceArray.reduce((sum, num) => {
            return sum + (num.quantity * num.price[buyerAccount]);
       }, 0)


       let opArgs = {}
        opArgs.data = {
            ...args.data,
            totalPrice
        }
        

        opArgs.data.buyer = {
            connect:{
                id: args.data.buyer
            }
        }

        opArgs.data.products = {
            create: newProducts.map(np=>{
                return { 
                    quantity: np.quantity,
                    product: {
                    connect: {
                        id: np.product
                    }
                } }
            }),
            update: updatedProducts.map(up => {
                return {
                    where: {
                        id: up.orderedProduct
                    },
                    data: {
                        quantity: up.quantity
                    }
                }
            })
        }   
         delete opArgs.data.buyerAccount;
         delete opArgs.data.oldProductData; 
         delete opArgs.data.oldShippingFee;
         delete opArgs.data.oldTotalPrice;     
 
        return prisma.mutation.updateOrder({
            ...opArgs,
            where:{
                id: args.id
            }
        }, info)
    },

    async processOrder(parent, args, { prisma, request }, info){
        // const userId = getUserId(request)

        // const user = await prisma.query.user(
        //     {
        //      where:{
        //          id:userId
        //      }
        //     } 
        //  )
        // const accountType = user.accountType

        // if(accountType !== "PROVINCIAL_DISTRIBUTOR"){
        //     throw new Error("Not allowed to process order")
        // }

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
            ...args.data,
            image: args.data.image.toString()

        }
        opArgsProduct.data.category = {
            connect:{
                id: args.data.category
            }
        }
        opArgsProduct.data.price = {
            connect:{
                id: price.id
            }
        }

        console.log(opArgsProduct)
        return prisma.mutation.createProduct(opArgsProduct, info)
    },

    async deleteProduct(parent, args, {prisma, request}, info){
        const a = await prisma.query.product({
            where: {
                id: args.id
            }
        }, `{
            price{
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            orderedProduct(where: {
              order: {
                isPaid_not:true
              }
            }){
              id
              quantity
                order{
                id
                buyer{
                  accountType
                }
                totalPrice
              }
            }
          }`)
        const price = a.price; 
        for (const o of a.orderedProduct) {
            let totalPrice = o.order.totalPrice - (o.quantity * price[accountTypes[o.order.buyer.accountType]]);
            await prisma.mutation.updateOrder({
                where: {
                    id: o.order.id
                }, data: {
                    totalPrice
                }

            })
        }
        
        return await prisma.mutation.deleteProduct({
            where: {
                id: args.id
            }
        }, `{id}`)
    },

    async updateProduct(parent, args, { prisma, request }, info) {
        const priceChanged = JSON.stringify(args.data.price) == JSON.stringify(args.data.oldPrice);
        let opArgsProduct = {}
        opArgsProduct.data = {
            ...args.data
        }
        opArgsProduct.data.price = {
            update: {
                ...args.data.price
            }
        } 
        opArgsProduct.data.category = {
            connect:{
                id: args.data.category
            }
        }

        delete opArgsProduct.data.oldPrice;
        const mustReturn =  await prisma.mutation.updateProduct({
            where: {
                id: args.id
            },
            data: {
                ...opArgsProduct.data
            }
        }, `{
            id
            name
            code
            available
            expDate
            price {
              retail
              reseller
              cityDistributor
              provincialDistributor
            }
            category{
              id
              name
            }
            orderedProduct(where: {
                AND: [{
                product: {
                  id: "cjz0pzd9503cl0772gkt2x7cc"
                }
                }, {
                  order: {
                    isPaid_not:true
                  }
                }]
              }){
                quantity
                order{
                    id
                    totalPrice
                    buyer{
                        accountType
                    }
                }
              }
        }`)
        if(priceChanged) {
            for (const orderInfo of mustReturn.orderedProduct) {
                const newPrice = orderInfo.order.totalPrice
               - (orderInfo.quantity * args.data.oldPrice[accountTypes[orderInfo.order.buyer.accountType]])
               + (orderInfo.quantity * mustReturn.price[accountTypes[orderInfo.order.buyer.accountType]]);
    
               await prisma.mutation.updateOrder({where: {
                   id: orderInfo.order.id
               }, data: {
                   totalPrice: newPrice
               }})
            }
        }
        

        return mustReturn;
    },

    async createCategory(paren, args, { prisma, request }, info) {
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
            throw new Error("Not allowed to create category")
        }

        return prisma.mutation.createCategory({
            data:{
                name: args.data.name,
                description: args.data.description
            } 
        }, info)
    },

    async updateCategory(paren, args, { prisma, request }, info) {
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
            throw new Error("Not allowed to update category")
        }

        return prisma.mutation.updateCategory({
            data: {
                name: args.data.name,
                description: args.data.description
            },
            where: {
                id: args.id
            }
        })
    },

    async deleteCategory(parent, args, {prisma, request}, info){
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
            throw new Error("Not allowed to delete product")
        }
        
        return prisma.mutation.deleteCategory({
            where: {
                id: args.id
            }
        }, info)
    },

}

export { Mutation as default }