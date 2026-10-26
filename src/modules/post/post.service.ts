import { CommentStatus, Post, PostStatus } from "../../../generated/prisma/client"
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma"

const createPost = async (data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>, userId: string) => {
    const result = await prisma.post.create({
        data: {
            ...data, authorId: userId
        }
    })
    return result;
}
const getAllPost = async ({ search, tags, isFeatured, status, authorId, page, limit, skip, sortBy, sortOrder }:
    { search: string | undefined, tags: string[] | [], isFeatured: boolean | undefined, status: PostStatus | undefined, authorId: string | undefined, page: number, limit: number, skip: number, sortBy: string, sortOrder: string }) => {
    const adnConditions: PostWhereInput[] = []
    if (search) {
        adnConditions.push({
            OR: [
                {
                    title: {
                        contains: search as string,
                        mode: "insensitive",
                    }
                },
                {
                    context: {
                        contains: search as string,
                        mode: "insensitive",
                    }
                },
                {
                    tags: {
                        has: search as string,
                    }
                }
            ]
        })
    }
    if (tags.length > 0) {
        adnConditions.push({
            tags: {
                hasEvery: tags as string[]
            }
        })
    }
    if (typeof isFeatured === 'boolean') {
        adnConditions.push({
            isFeatured
        })
    }
    if (status) {
        adnConditions.push({
            status
        })
    }
    if (authorId) {
        adnConditions.push({
            authorId
        })
    }
    const allPost = await prisma.post.findMany({
        take: limit,
        skip,
        where: {
            AND: adnConditions
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        include: {
            _count: {
                select: { comments: true }
            }
        }
    });
    const total = await prisma.post.count({
        where: {
            AND: adnConditions
        }
    })
    return {
        data: allPost,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}
const getPostById = async (postId: string) => {
    const result = await prisma.$transaction(async (prisma) => {
        await prisma.post.update({
            where: {
                id: postId
            },
            data: {
                views: {
                    increment: 1
                }
            }
        })
        const postData = await prisma.post.findUnique({
            where: {
                id: postId
            },
            include: {
                comments: {
                    where: {
                        parentId: null,
                        status: CommentStatus.APPROVED
                    },
                    orderBy: { createdAt: "desc" },
                    include: {
                        replise: {
                            where: {
                                status: CommentStatus.APPROVED
                            },
                            orderBy: { createdAt: "asc" },
                            include: {
                                replise: {
                                    where: {
                                        status: CommentStatus.APPROVED
                                    },
                                    orderBy: { createdAt: "asc" },
                                }

                            }
                        }
                    }
                },
                _count: {
                    select: { comments: true }
                }
            },
        })
        return postData
    })
    return result
}
const getMyPosts = async (authorId: string) => {
    const userInfo = await prisma.user.findUnique({
        where: {
            id: authorId,
            status: "ACTIVE"
        },
        select: {
            id: true,
            status: true
        }
    })
    const result = await prisma.post.findMany({
        where: {
            authorId
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            _count: {
                select: {
                    comments: true
                }
            }
        }
    });
    // const total = await prisma.post.count({
    //     where: {
    //         authorId
    //     }
    // })
    const total = await prisma.post.aggregate({
        _count: {
            id: true
        },
        where: {
            authorId
        }
    })
    return {
        data: result,
        total
    };
}

/* 
user sudu nijer post update korte parbe and isFeatured update korte parbe na
admin sobar post update kore parbe
*/
const updateMyPosts = async (postId: string, data: Partial<Post>, authorId: string, isAdmin: boolean) => {
    // console.log(postId, data, authorId);
    const postData = await prisma.post.findUniqueOrThrow({
        where: {
            id: postId
        },
        select: {
            id: true,
            authorId: true
        }
    })

    if (!isAdmin && (postData.authorId !== authorId)) {
        throw new Error("you are not the owner of the post")
    }
    if (!isAdmin) {
        delete data.isFeatured
    }
    const result = await prisma.post.update({
        where: {
            id: postData.id
        },
        data
    })
    return result;
}

/* 
user nijer post delete korte parbe and admin sobar post delete korte parbe
*/
const deletePost = async (postId: string, authorId: string, isAdmin: boolean) => {
    const postData = await prisma.post.findUniqueOrThrow({
        where: {
            id: postId
        },
        select: {
            id: true,
            authorId: true
        }
    })
    if (!isAdmin && (postData.authorId !== authorId)) {
        throw new Error("you are not the owner of the post")
    }
    return await prisma.post.delete({
        where: {
            id: postId
        }
    })
}



const getStats = async () => {
    // post count, published posts, draft post, total comments, total views
    return await prisma.$transaction(async (prismatx) => {
        const [totalPosts, publishedPosts, draftPosts, archivedPosts, totalComments, approvedComment, rejectComment, totalUsers, adminCount, userCount, totalViews] = await Promise.all([
            await prismatx.post.count(),
            await prismatx.post.count({ where: { status: PostStatus.PUBLISHED } }),
            await prismatx.post.count({ where: { status: PostStatus.DRAFT } }),
            await prismatx.post.count({ where: { status: PostStatus.ARCHIVED } }),
            await prismatx.comment.count(),
            await prismatx.comment.count({ where: { status: CommentStatus.APPROVED } }),
            await prismatx.comment.count({ where: { status: CommentStatus.REJECT } }),
            await prismatx.user.count(),
            await prismatx.user.count({ where: { role: "ADMIN" } }),
            await prismatx.user.count({ where: { role: "USER" } }),
            await prismatx.post.aggregate({ _sum: { views: true } })
        ])

        return {
            totalPosts, publishedPosts, draftPosts, archivedPosts, totalComments, approvedComment, rejectComment, totalUsers, adminCount, userCount, totalViews: totalViews._sum.views
        }
    })
}


export const postServices = {
    createPost, getAllPost, getPostById, getMyPosts, updateMyPosts, deletePost, getStats
}