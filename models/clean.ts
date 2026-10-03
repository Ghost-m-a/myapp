/**
 * Shared toJSON factory: keeps Mongoose's virtual `id`, drops `_id`/`__v`,
 * and removes each key in `hidden`.
 */
export default function clean(hidden: string[] = []) {
   return {
      virtuals: true,
      versionKey: false as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: (_doc: unknown, ret: any) => {
         delete ret._id;
         for (const key of hidden) delete ret[key];
      },
   };
}
