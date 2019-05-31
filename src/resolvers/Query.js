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
    }
}

export { Query as default }