"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentValidation } from "@/lib/validations/thread";
import { Input } from "../ui/input";
//import { createThread } from "@/lib/actions/thread.actions";
import Image from "next/image";
import { addCommentToThread } from "@/lib/actions/thread.actions";


interface Props {
    threadId: string;
    currentUserImage: string;
    currentUserId: string;
}

const Comment = ({ threadId, currentUserImage, currentUserId }: Props) => {

    const router = useRouter();
    const pathname = usePathname();

    const form = useForm({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: "",
            accountId: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
        await addCommentToThread(
            threadId,
            values.thread,
            JSON.parse(currentUserId),
            pathname
        );

        form.reset();
    };
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='comment-form'
            >
                <FormField
                    control={form.control}
                    name='thread'
                    render={({ field }) => (
                        <FormItem className='flex w-full items-center gap-3'>
                            <FormLabel>
                                <Image src={currentUserImage} alt="currentUserImage"
                                    width={48}
                                    height={48}
                                    className="rounded-full 
                                    object-cover" />
                            </FormLabel>
                            <FormControl className='border-none bg-transparent'>
                                <Input
                                    type="text"
                                    placeholder="Comment here"
                                    className="no-focus text-light-1 outline-none"

                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type='submit' className='comment-form_btn'>
                    Relpy
                </Button>
            </form>
        </Form>
    )
}

export default Comment;