import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Container,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Alert,
  AlertIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { FaFileAlt, FaDownload, FaUpload, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Resumes = ({ url }) => {
  const navigate = useNavigate();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  const [resumes, setResumes] = useState([
    // Sample data - replace with actual API data
    {
      id: 1,
      name: "John Doe",
      position: "Software Developer",
      status: "pending",
      submittedDate: "2024-01-15",
      experience: "3 years",
      skills: ["React", "Node.js", "JavaScript"]
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "UI/UX Designer",
      status: "approved",
      submittedDate: "2024-01-14",
      experience: "2 years",
      skills: ["Figma", "Adobe XD", "Photoshop"]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedResume, setSelectedResume] = useState(null);

  const handleBack = () => {
    navigate('/admin');
  };

  const handleViewResume = (resume) => {
    setSelectedResume(resume);
    onOpen();
  };

  const handleStatusChange = (resumeId, newStatus) => {
    setResumes(prev => prev.map(resume => 
      resume.id === resumeId ? { ...resume, status: newStatus } : resume
    ));
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || resume.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg={pageBg}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={4}>
              <IconButton
                aria-label="Go back"
                icon={<ArrowBackIcon />}
                onClick={handleBack}
                variant="ghost"
                size="lg"
              />
              <VStack align="start" spacing={1}>
                <Heading as="h1" fontSize="2xl" color={headingColor}>
                  Resume Management
                </Heading>
                <Text color="gray.600">
                  Manage and review submitted resumes
                </Text>
              </VStack>
            </Flex>
            
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              size="lg"
              onClick={() => {/* Handle add resume */}}
            >
              Add Resume
            </Button>
          </Flex>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <FaFileAlt size={24} color="#3182CE" />
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.length}
                </Text>
                <Text color="gray.600">Total Resumes</Text>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <Badge colorScheme="yellow" fontSize="sm" p={2} borderRadius="md">
                  Pending
                </Badge>
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.filter(r => r.status === 'pending').length}
                </Text>
                <Text color="gray.600">Pending Review</Text>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <Badge colorScheme="green" fontSize="sm" p={2} borderRadius="md">
                  Approved
                </Badge>
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.filter(r => r.status === 'approved').length}
                </Text>
                <Text color="gray.600">Approved</Text>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <Badge colorScheme="red" fontSize="sm" p={2} borderRadius="md">
                  Rejected
                </Badge>
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.filter(r => r.status === 'rejected').length}
                </Text>
                <Text color="gray.600">Rejected</Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search and Filter */}
          <Flex gap={4} flexWrap="wrap">
            <Box flex="1" minW="200px">
              <FormControl>
                <FormLabel>Search Resumes</FormLabel>
                <Flex>
                  <Input
                    placeholder="Search by name or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRightRadius="none"
                  />
                  <IconButton
                    borderLeftRadius="none"
                    icon={<FaSearch />}
                    aria-label="Search"
                  />
                </Flex>
              </FormControl>
            </Box>
            
            <Box minW="150px">
              <FormControl>
                <FormLabel>Filter by Status</FormLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </FormControl>
            </Box>
          </Flex>

          {/* Resumes List */}
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredResumes.map((resume) => (
                <Card key={resume.id} bg={cardBg} borderColor={cardBorder}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{resume.name}</Heading>
                        <Text color="gray.600">{resume.position}</Text>
                      </VStack>
                      <Badge colorScheme={getStatusColor(resume.status)}>
                        {resume.status}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Experience: {resume.experience}
                      </Text>
                      
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>
                          Skills:
                        </Text>
                        <Flex gap={1} flexWrap="wrap">
                          {resume.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" fontSize="xs">
                              {skill}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                      
                      <Text fontSize="xs" color="gray.500">
                        Submitted: {new Date(resume.submittedDate).toLocaleDateString()}
                      </Text>
                      
                      <Flex gap={2} justify="space-between">
                        <Button
                          size="sm"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleViewResume(resume)}
                        >
                          View
                        </Button>
                        
                        <Select
                          size="sm"
                          value={resume.status}
                          onChange={(e) => handleStatusChange(resume.id, e.target.value)}
                          maxW="120px"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approve</option>
                          <option value="rejected">Reject</option>
                        </Select>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {filteredResumes.length === 0 && !loading && (
            <Center py={8}>
              <VStack spacing={4}>
                <FaFileAlt size={48} color="#A0AEC0" />
                <Text fontSize="lg" color="gray.500">
                  No resumes found
                </Text>
                <Text color="gray.400">
                  Try adjusting your search criteria
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>

        {/* Resume Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Resume Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedResume && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold">Name:</Text>
                    <Text>{selectedResume.name}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Position:</Text>
                    <Text>{selectedResume.position}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Experience:</Text>
                    <Text>{selectedResume.experience}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Skills:</Text>
                    <Flex gap={2} flexWrap="wrap">
                      {selectedResume.skills.map((skill, index) => (
                        <Badge key={index} colorScheme="blue">
                          {skill}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Status:</Text>
                    <Badge colorScheme={getStatusColor(selectedResume.status)}>
                      {selectedResume.status}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Submitted Date:</Text>
                    <Text>{new Date(selectedResume.submittedDate).toLocaleDateString()}</Text>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Close
              </Button>
              <Button colorScheme="blue">
                Download Resume
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Resumes;
