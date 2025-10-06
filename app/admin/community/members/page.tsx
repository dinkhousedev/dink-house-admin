"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useDisclosure } from "@heroui/use-disclosure";

import VerifyDuprModal from "@/components/admin/VerifyDuprModal";

import type { Member, MembersListResponse } from "@/types/admin/member";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [duprFilter, setDuprFilter] = useState<string>("");
  const [membershipFilter, setMembershipFilter] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(duprFilter && { dupr_status: duprFilter }),
        ...(membershipFilter && { membership_level: membershipFilter }),
      });

      const response = await fetch(`/api/admin/members?${params}`);
      const data: MembersListResponse = await response.json();

      if (data.success) {
        setMembers(data.members);
        setTotalPages(data.total_pages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, duprFilter, membershipFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "success";
      case "pending_verification":
        return "warning";
      case "incomplete":
        return "default";
      default:
        return "default";
    }
  };

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "vip":
        return "secondary";
      case "premium":
        return "primary";
      case "basic":
        return "success";
      case "guest":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="w-full p-6">
      <Card className="border border-dink-gray bg-[#0F0F0F]/90">
        <CardHeader className="flex-col items-start gap-3 p-6">
          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-dink-white">
                Members
              </h1>
              <p className="mt-2 text-sm text-default-500">
                Manage member profiles, verify DUPR ratings, and view transaction
                history
              </p>
            </div>
            <Chip color="primary" size="lg" variant="flat">
              {total} Total Members
            </Chip>
          </div>

          {/* Filters */}
          <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              classNames={{
                input: "text-sm",
                inputWrapper: "bg-[#151515] border border-dink-gray",
              }}
              placeholder="Search by name or email..."
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={20}
                />
              }
              value={search}
              variant="bordered"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              classNames={{
                trigger: "bg-[#151515] border border-dink-gray",
              }}
              label="DUPR Status"
              placeholder="All Statuses"
              variant="bordered"
              onChange={(e) => {
                setDuprFilter(e.target.value);
                setPage(1);
              }}
            >
              <SelectItem key="">All Statuses</SelectItem>
              <SelectItem key="incomplete">Incomplete</SelectItem>
              <SelectItem key="pending">Pending Verification</SelectItem>
              <SelectItem key="verified">Verified</SelectItem>
            </Select>
            <Select
              classNames={{
                trigger: "bg-[#151515] border border-dink-gray",
              }}
              label="Membership Level"
              placeholder="All Levels"
              variant="bordered"
              onChange={(e) => {
                setMembershipFilter(e.target.value);
                setPage(1);
              }}
            >
              <SelectItem key="">All Levels</SelectItem>
              <SelectItem key="guest">Guest</SelectItem>
              <SelectItem key="basic">Basic</SelectItem>
              <SelectItem key="premium">Premium</SelectItem>
              <SelectItem key="vip">VIP</SelectItem>
            </Select>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table
            aria-label="Members table"
            classNames={{
              wrapper: "bg-transparent shadow-none p-6",
              th: "bg-[#151515] text-dink-white",
              td: "text-default-500",
            }}
            bottomContent={
              totalPages > 1 ? (
                <div className="flex w-full justify-center p-4">
                  <Pagination
                    color="primary"
                    page={page}
                    showControls
                    total={totalPages}
                    onChange={(newPage) => setPage(newPage)}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>LOCATION</TableColumn>
              <TableColumn>DUPR</TableColumn>
              <TableColumn>MEMBERSHIP</TableColumn>
              <TableColumn>JOINED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon
                    className="text-default-300"
                    icon="solar:users-group-rounded-outline"
                    width={48}
                  />
                  <p className="mt-4 text-default-500">No members found</p>
                </div>
              }
              isLoading={loading}
              loadingContent={<Spinner color="primary" />}
            >
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium text-dink-white">
                        {member.full_name}
                      </p>
                      <p className="text-xs text-default-400">{member.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    {member.city && member.state
                      ? `${member.city}, ${member.state}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {member.dupr_rating?.toFixed(2) || "-"}
                      </span>
                      <Chip
                        color={getStatusColor(member.profile_status)}
                        size="sm"
                        variant="flat"
                      >
                        {member.profile_status === "verified"
                          ? "✓"
                          : member.profile_status === "pending_verification"
                            ? "⏳"
                            : "○"}
                      </Chip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getMembershipColor(member.membership_level)}
                      size="sm"
                      variant="flat"
                    >
                      {member.membership_level.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        className="text-default-500 hover:text-dink-lime"
                        size="sm"
                        variant="light"
                      >
                        <Icon icon="solar:eye-linear" width={20} />
                      </Button>
                      {member.profile_status === "pending_verification" && (
                        <Button
                          isIconOnly
                          className="text-warning hover:text-warning-600"
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedMember(member);
                            onOpen();
                          }}
                        >
                          <Icon
                            icon="solar:shield-check-linear"
                            width={20}
                          />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Verification Modal */}
      <VerifyDuprModal
        isOpen={isOpen}
        member={selectedMember}
        onClose={onClose}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
