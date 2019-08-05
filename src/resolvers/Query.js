import getUserId from '../utils/getUserId'

const Query = {
    users(parent, args, { prisma }, info) {
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        
        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                }]
            }
        }

        return prisma.query.users(opArgs, info)
    },
   async user(parent, args, { prisma }, info) {
        const user =  await prisma.query.user({
            where: {
                id: args.id
            }
        }, info);

        if (!user) {
            throw new Error('User not found')
        }
        console.log(user);
        return user;
    },
    me(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)
        
        return prisma.query.user({
            where: {
                id: userId
            }
        })
    },

    orders(parent, args, { prisma }, info) {
        let opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        
        if (typeof(args.isPaid) === "boolean") {
            opArgs.where = {
                isPaid: args.isPaid
            }
        }
        return prisma.query.orders(opArgs, info)
    },

    order(parent, args, { prisma }, info) {
        const order =  prisma.query.order({
            where: {
                id: args.id
            }
        }, info);

        if (!order) {
            throw new Error('Product not found')
        }

        return order;
    },
    products(parent, args, { prisma }, info){
        let opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        
        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                },
                {
                    code_contains: args.query
                }]
            }
        }
        return prisma.query.products(opArgs, info)
    },
    
    async product(parent, args, { prisma }, info) {

        const product = await prisma.query.product({
            where: {
                id: args.id
            }
        }, info);

        if (!product) {
            throw new Error('Product not found')
        }

        return product;

    },
    categories(parent, args, { prisma }, info) {
        let opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }
        
        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                },
                {
                    description_contains: args.query
                }]
            }
        }
        return prisma.query.categories(opArgs, info)
    },
    async category(parent, args, { prisma }, info) {

        const category = await prisma.query.category({
            where: {
                id: args.id
            }
        }, info);

        if (!category) {
            throw new Error('Category not found')
        }

        return category;

    },
}

export { Query as default }