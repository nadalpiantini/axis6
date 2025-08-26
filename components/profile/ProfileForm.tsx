"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { profileFormSchema, type ProfileFormData, timezoneOptions } from "@/lib/validation/profile"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/Button"

interface ProfileFormProps {
  userId: string
  initialData?: Partial<ProfileFormData>
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfileForm({ userId, initialData, onSuccess, onCancel }: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      bio: initialData?.bio || "",
      about: initialData?.about || "",
      location: initialData?.location || "",
      city: initialData?.city || "",
      timezone: initialData?.timezone || "America/Santo_Domingo",
      birthday: initialData?.birthday,
    },
  })

  const { handleSubmit, formState: { isSubmitting } } = form

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const supabase = createClient()

      // Convert birthday to ISO string if provided
      const formattedData = {
        ...data,
        birthday: data.birthday ? data.birthday.toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('axis6_profiles')
        .upsert({
          id: userId,
          ...formattedData,
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      toast.success("Profile updated successfully!")
      onSuccess?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile. Please try again.")
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="Enter your phone number"
                      autoComplete="tel"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Include country code if international.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Birthday Field */}
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birthday</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select your birthday"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Used for personalized recommendations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Field */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="City, Country"
                      autoComplete="address-level1"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Your general location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timezone Field */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Used for scheduling and time-based features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bio Field */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  Optional. A short description about yourself (max 500 characters).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* About Field */}
          <FormField
            control={form.control}
            name="about"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Share more details about your wellness journey, goals, interests..."
                    rows={4}
                    maxLength={1000}
                  />
                </FormControl>
                <FormDescription>
                  Optional. A longer description about your wellness journey and goals (max 1000 characters).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
    </Form>
  )
}