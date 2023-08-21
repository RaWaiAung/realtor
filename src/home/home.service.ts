import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
import {
  CreateHomeParams,
  GetHomeParams,
  UpdateHomeParams,
} from 'src/home/dto/types/homeParams';
import { UserInfo } from 'src/user/decorators/user.decorator';

@Injectable()
export class HomeService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHomes(filter: GetHomeParams): Promise<HomeResponseDto[]> {
    const homes = await this.prismaService.home.findMany({
      select: {
        id: true,
        number_of_bedrooms: true,
        number_of_bathrooms: true,
        address: true,
        price: true,
        city: true,
        list_date: true,
        land_size: true,
        images: {
          select: {
            url: true,
          },
        },
      },
      where: filter,
    });

    if (!homes.length) {
      throw new NotFoundException();
    }

    return homes.map(
      (home) => new HomeResponseDto({ ...home, images: home.images[0].url }),
    );
  }

  async getHome(id: number) {
    const home = await this.prismaService.home.findFirst({
      where: {
        id,
      },
    });

    if (!home) {
      throw new NotFoundException();
    }
    return new HomeResponseDto(home);
  }

  async createHome(
    {
      address,
      city,
      numberOfBedrooms,
      numberOfBathrooms,
      landSize,
      price,
      propertyType,
      images,
    }: CreateHomeParams,
    user: UserInfo,
  ) {
    const createHome = await this.prismaService.home.create({
      data: {
        address,
        number_of_bedrooms: numberOfBedrooms,
        number_of_bathrooms: numberOfBathrooms,
        city,
        land_size: landSize,
        propertyType,
        price,
        realtor_id: user.id,
      },
    });

    const homeImages = images.map((image) => {
      return { ...image, home_id: createHome.id };
    });

    await this.prismaService.image.createMany({ data: homeImages });

    return new HomeResponseDto(createHome);
  }

  async updateHome(id: number, data: UpdateHomeParams) {
    const isHome = await this.prismaService.home.findUnique({
      where: {
        id,
      },
    });

    if (!isHome) {
      throw new NotFoundException();
    }

    const editHome = await this.prismaService.home.update({
      where: {
        id,
      },
      data: {
        address: data.address,
        city: data.city,
        number_of_bathrooms: data.numberOfBathrooms,
        number_of_bedrooms: data.numberOfBedrooms,
        price: data.price,
        propertyType: data.propertyType,
        land_size: data.landSize,
      },
    });

    return new HomeResponseDto(editHome);
  }

  async deleteHome(id: number) {
    await this.prismaService.image.deleteMany({
      where: {
        home_id: id,
      },
    });

    const deletedHome = await this.prismaService.home.delete({
      where: {
        id,
      },
    });

    return new HomeResponseDto(deletedHome);
  }

  async getRealtorByHomeId(id: number) {
    const home = await this.prismaService.home.findUnique({
      where: {
        id,
      },
      select: {
        realtor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!home) {
      throw new NotFoundException();
    }

    return home.realtor;
  }
}
