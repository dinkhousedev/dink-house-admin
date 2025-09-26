"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Icon } from "@iconify/react";
import { useDisclosure } from "@heroui/use-disclosure";

interface AllowedEmail {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  notes: string | null;
  is_active: boolean;
  used_at: string | null;
  created_at: string;
}

const roles = [
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
  { value: "coach", label: "Coach" },
  { value: "viewer", label: "Viewer" },
];

export default function AllowedEmailsPage() {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "viewer",
    notes: "",
  });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  useEffect(() => {
    fetchAllowedEmails();
  }, []);

  const fetchAllowedEmails = async () => {
    try {
      const response = await fetch("/api/admin/allowed-emails");

      if (response.ok) {
        const data = await response.json();

        setEmails(data);
      } else {
        console.error("Failed to fetch allowed emails");
      }
    } catch (error) {
      console.error("Failed to fetch allowed emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async () => {
    try {
      const response = await fetch("/api/admin/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmail),
      });

      if (response.ok) {
        const addedEmail = await response.json();

        setEmails([addedEmail, ...emails]);
        setNewEmail({
          email: "",
          first_name: "",
          last_name: "",
          role: "viewer",
          notes: "",
        });
        onOpenChange();
      } else {
        const error = await response.json();

        alert(error.error || "Failed to add email");
      }
    } catch (error) {
      console.error("Failed to add email:", error);
      alert("Failed to add email. Please try again.");
    }
  };

  const handleToggleActive = async (id: string) => {
    const email = emails.find((e) => e.id === id);

    if (!email) return;

    try {
      const response = await fetch(`/api/admin/allowed-emails?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !email.is_active }),
      });

      if (response.ok) {
        setEmails(
          emails.map((e) =>
            e.id === id ? { ...e, is_active: !e.is_active } : e,
          ),
        );
      } else {
        alert("Failed to update email status");
      }
    } catch (error) {
      console.error("Failed to toggle email:", error);
      alert("Failed to update email status");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to remove this email from the allowed list?",
      )
    ) {
      try {
        const response = await fetch(`/api/admin/allowed-emails?id=${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setEmails(emails.filter((email) => email.id !== id));
        } else {
          alert("Failed to delete email");
        }
      } catch (error) {
        console.error("Failed to delete email:", error);
        alert("Failed to delete email");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#000000] p-8">
      <div className="w-full max-w-6xl mx-auto">
        <Card className="border border-dink-gray/80 bg-[#0F0F0F]/90">
          <CardHeader className="flex items-center justify-between px-8 py-6">
            <div>
              <h1 className="text-2xl font-semibold text-dink-white">
                Allowed Email Addresses
              </h1>
              <p className="mt-1 text-sm text-default-500">
                Manage pre-authorized email addresses for employee sign-up
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              onPress={onOpen}
            >
              Add Email
            </Button>
          </CardHeader>
          <CardBody className="px-8 pb-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon
                  className="animate-spin text-dink-lime"
                  icon="solar:refresh-linear"
                  width={32}
                />
              </div>
            ) : (
              <Table
                aria-label="Allowed emails table"
                classNames={{
                  wrapper: "bg-[#151515] border border-dink-gray",
                }}
              >
                <TableHeader>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>NOTES</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{email.email}</span>
                      </TableCell>
                      <TableCell>
                        {email.first_name || email.last_name
                          ? `${email.first_name || ""} ${email.last_name || ""}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip color="primary" size="sm" variant="flat">
                          {email.role}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {email.used_at ? (
                          <Chip color="success" size="sm" variant="flat">
                            Used
                          </Chip>
                        ) : email.is_active ? (
                          <Chip color="default" size="sm" variant="flat">
                            Available
                          </Chip>
                        ) : (
                          <Chip color="danger" size="sm" variant="flat">
                            Inactive
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-default-500">
                          {email.notes || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            isDisabled={email.used_at !== null}
                            size="sm"
                            variant="light"
                            onPress={() => handleToggleActive(email.id)}
                          >
                            <Icon
                              icon={
                                email.is_active
                                  ? "solar:pause-circle-linear"
                                  : "solar:play-circle-linear"
                              }
                              width={18}
                            />
                          </Button>
                          <Button
                            isIconOnly
                            color="danger"
                            isDisabled={email.used_at !== null}
                            size="sm"
                            variant="light"
                            onPress={() => handleDelete(email.id)}
                          >
                            <Icon icon="solar:trash-bin-2-linear" width={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Modal
          classNames={{
            base: "bg-[#0F0F0F] border border-dink-gray",
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Add Allowed Email
                </ModalHeader>
                <ModalBody>
                  <Input
                    classNames={{
                      inputWrapper: "bg-[#151515] border border-dink-gray",
                    }}
                    label="Email Address"
                    placeholder="employee@dinkhouse.com"
                    type="email"
                    value={newEmail.email}
                    variant="bordered"
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, email: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      classNames={{
                        inputWrapper: "bg-[#151515] border border-dink-gray",
                      }}
                      label="First Name"
                      placeholder="John"
                      value={newEmail.first_name}
                      variant="bordered"
                      onChange={(e) =>
                        setNewEmail({ ...newEmail, first_name: e.target.value })
                      }
                    />
                    <Input
                      classNames={{
                        inputWrapper: "bg-[#151515] border border-dink-gray",
                      }}
                      label="Last Name"
                      placeholder="Doe"
                      value={newEmail.last_name}
                      variant="bordered"
                      onChange={(e) =>
                        setNewEmail({ ...newEmail, last_name: e.target.value })
                      }
                    />
                  </div>
                  <Select
                    classNames={{
                      trigger: "bg-[#151515] border border-dink-gray",
                    }}
                    label="Default Role"
                    placeholder="Select a role"
                    selectedKeys={[newEmail.role]}
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      setNewEmail({
                        ...newEmail,
                        role: Array.from(keys)[0] as string,
                      })
                    }
                  >
                    {roles.map((role) => (
                      <SelectItem key={role.value}>{role.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    classNames={{
                      inputWrapper: "bg-[#151515] border border-dink-gray",
                    }}
                    label="Notes (Optional)"
                    placeholder="Any additional notes..."
                    value={newEmail.notes}
                    variant="bordered"
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, notes: e.target.value })
                    }
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!newEmail.email}
                    onPress={handleAddEmail}
                  >
                    Add Email
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
