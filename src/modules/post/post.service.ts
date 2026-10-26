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
export const postServices = {
    createPost, getAllPost, getPostById
}