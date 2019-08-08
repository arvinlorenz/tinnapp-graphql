import getUserId from '../utils/getUserId'

const User = {
    email: {
        fragment: 'fragment userId on User { id }',
        async resolve(parent, args, { request, prisma }, info) {
            const userId = getUserId(request, false)
            const user =  await prisma.query.user(
                {
                 where:{
                     id:userId
                 }
                } 
             )
            const accountType = user.accountType;
            if ((userId && (userId === parent.id)) || accountType === 'PROVINCIAL_DISTRIBUTOR') {
                return parent.email
            } else {
                return null
            }
        }
    }
}

export { User as default }